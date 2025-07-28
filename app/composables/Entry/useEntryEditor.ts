import {computed,  markRaw, ref,  watch} from "vue";
import type {ComputedRef, Ref} from "vue";
import {useRoute} from "vue-router";
import type {
    BlockData,
    DialogueBlockData,
    FlatBlockInfo,
    GroupedBlocks,
    InlineNode,
    ScriptBlockData,
    TextNode,
} from "~/types/blocks";
import { EntryType} from "#shared-types/Entry";
import type {EntryData} from "#shared-types/Entry";
import BlockSchema, { topLevelAllowedBlocks } from "~/config/blocks/blockSchema";
import { createBaseBlock } from "~/utils/blocks/createBaseBlock";
import { entryTemplates } from "~/data/templates/entryTemplates";
import { useEntryUtils } from "~/composables/Entry/useEntryUtils";
import { useDebounce } from "~/composables/useDebounce";

export interface EditorCallbacks {
    insertBlockAtPosition: (
        newBlock: BlockData,
        position: { blockId: string | null; offset: number },
    ) => void;
    updateBlock: (blockId: string, newData: Partial<BlockData>) => void;
    duplicateBlock: (blockId: string) => void;
    deleteBlock: (blockId: string) => void;
    replaceBlock: (oldBlockId: string, newBlock: BlockData) => void;
    getParentBlockType: (blockId: string) => string | undefined;
    getBlockElement: (blockId: string) => HTMLElement | null;
    onEmptySlotClick: (
        parentId: string,
        parentBlockType: string,
        position: { x: number; y: number },
        targetSlotName?: string | null,
    ) => void;
    onInsertBlockAbove: (blockId: string) => void;
    onInsertBlockBelow: (blockId: string) => void;
    getAvailableCharactersForDialogue: (dialogueBlockId: string) => string[];
    onCharacterRemovedFromScript: (characterName: string, scriptBlockId: string) => void;
    showMessage: (message: string, type: "info" | "warning" | "error" | "success") => void;
}

interface UseEntryEditorProps {
    initialEntryData: EntryData;
    isEditable: boolean;
}

interface ModalTriggerInfo {
    parentId: string;
    parentBlockType: string;
    position: { x: number; y: number };
    insertPosition: "into" | "above" | "below";
    targetBlockId?: string | null;
    targetSlotName?: string | null | undefined;
}

interface PathSegment {
    block: BlockData;
    slotName?: string;
}

interface ParentInfo {
    parentId: string;
    parentBlockType: string;
    targetSlotName: string | undefined;
}

interface BlockSearchResult {
    block: BlockData;
    path: PathSegment[];
    index: number;
    parentBlocks: BlockData[];
}

const getParentInfoFromBlockPath = (path: PathSegment[]): ParentInfo => {
    let parentId: string;
    let parentBlockType: string;
    let targetSlotName: string | undefined;

    if (path.length > 1) {
        const parentBlock = path[path.length - 2].block;
        parentId = parentBlock.id;
        parentBlockType = parentBlock.type;
        targetSlotName = path[path.length - 1].slotName;
    } else {
        parentId = "document-root";
        parentBlockType = "document-root";
        targetSlotName = undefined;
    }
    return { parentId, parentBlockType, targetSlotName };
};

const removeBlockRecursive = (
    blocksToUpdate: BlockData[],
    blockIdToRemove: string,
): BlockData[] => {
    return blocksToUpdate.reduce((acc: BlockData[], block) => {
        if (block.id === blockIdToRemove) {
            return acc;
        }

        if ("slots" in block && block.slots) {
            let slotsChanged = false;
            const updatedSlots: Record<string, BlockData[]> = {};

            for (const slotName in block.slots) {
                if (Object.prototype.hasOwnProperty.call(block.slots, slotName)) {
                    const currentSlotBlocks = block.slots[slotName];
                    const updatedSlotBlocks = removeBlockRecursive(
                        currentSlotBlocks,
                        blockIdToRemove,
                    );

                    if (updatedSlotBlocks !== currentSlotBlocks) {
                        slotsChanged = true;
                    }
                    updatedSlots[slotName] = updatedSlotBlocks;
                }
            }

            if (slotsChanged) {
                acc.push({
                    ...block,
                    slots: updatedSlots,
                } as BlockData);
            } else {
                acc.push(block);
            }
        } else {
            acc.push(block);
        }
        return acc;
    }, []);
};

const updateBlockDataRecursive = (
    blocksToUpdate: BlockData[],
    blockIdToUpdate: string,
    newData: Partial<BlockData>,
): BlockData[] => {
    return blocksToUpdate.map((block) => {
        if (block.id === blockIdToUpdate) {
            return { ...block, ...newData } as BlockData;
        }

        if ("slots" in block && block.slots) {
            let slotsChanged = false;
            const updatedSlots: Record<string, BlockData[]> = {};

            for (const slotName in block.slots) {
                if (Object.prototype.hasOwnProperty.call(block.slots, slotName)) {
                    const currentSlotBlocks = block.slots[slotName];
                    const updatedSlotBlocks = updateBlockDataRecursive(
                        currentSlotBlocks,
                        blockIdToUpdate,
                        newData,
                    );
                    if (updatedSlotBlocks !== currentSlotBlocks) {
                        slotsChanged = true;
                    }
                    updatedSlots[slotName] = updatedSlotBlocks;
                }
            }

            if (slotsChanged) {
                return { ...block, slots: updatedSlots } as BlockData;
            }
        }
        return block;
    });
};

const deepClone = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepClone(item));
    }

    // Handle specific objects that should not be cloned deeply if necessary,
    // e.g., Vue reactive objects or DOM elements.
    // For plain objects, continue with deep clone.
    if (obj.constructor !== Object) {
        return obj;
    }

    const cloned: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
        }
    }
    return cloned;
};

const cloneBlockWithNewIds = (block: BlockData): BlockData => {
    const clonedAttrs: BlockData["attrs"] = block.attrs
        ? (deepClone(block.attrs) as BlockData["attrs"])
        : {};

    let clonedSlots: BlockData["slots"] = undefined;
    if ("slots" in block && block.slots !== undefined && block.slots !== null) {
        const tempClonedSlots: Record<string, BlockData[]> = {};
        for (const slotName in block.slots) {
            if (
                Object.prototype.hasOwnProperty.call(block.slots, slotName) &&
                Array.isArray(block.slots[slotName])
            ) {
                tempClonedSlots[slotName] =
                    block.slots[slotName].map(cloneBlockWithNewIds);
            }
        }
        clonedSlots = tempClonedSlots;
    }

    return createBaseBlock(block.type, {
        attrs: clonedAttrs,
        slots: clonedSlots,
    });
};

export const useEntryEditor = ({
                                  initialEntryData,
                                  isEditable,
                              }: UseEntryEditorProps) => {
    const route = useRoute();
    const pathname = computed(() => route.path);

    const { saveEntry } = useEntryUtils();

    const entryData: Ref<EntryData> = ref(initialEntryData);
    const blocks: ComputedRef<BlockData[]> = computed(
        () => entryData.value?.blocks || [],
    );

    const saveStatus = ref<"idle" | "saving" | "saved" | "error">("idle");
    const searchTerm = ref("");
    const focusedIndex = ref(0);
    const modalTriggerInfo = ref<ModalTriggerInfo | null>(null);

    const loading = ref(false);
    const error = ref<string | null>(null);
    const displayLastModified = ref<string | null>(null);

    const entryTemplate = computed(
        () => entryTemplates[entryData.value.type || EntryType.DEFAULT],
    );
    
    watch(
        () => initialEntryData,
        (newValue) => {
            if (newValue) {
                entryData.value = newValue;
            }
        },
        { immediate: true },
    );

    watch(
        () => entryData.value?.lastModified,
        (newValue) => {
            if (newValue) {
                displayLastModified.value = new Date(newValue).toLocaleString();
            } else {
                displayLastModified.value = null;
            }
        },
        { immediate: true },
    );

    const findBlockAndPath = (
        currentBlocks: BlockData[],
        blockId: string,
        pathAccumulator: PathSegment[] = [],
        slotNameOfCurrentBlocks?: string,
    ): BlockSearchResult | null => {
        for (const [index, block] of currentBlocks.entries()) {
            if (block.id === blockId) {
                const pathWithFoundBlock = [
                    ...pathAccumulator,
                    { block: block, slotName: slotNameOfCurrentBlocks },
                ];
                return {
                    block: block,
                    path: pathWithFoundBlock,
                    index: index,
                    parentBlocks: currentBlocks,
                };
            }

            if ("slots" in block && block.slots) {
                for (const slotName of Object.keys(block.slots)) {
                    const slotBlocks = block.slots[slotName];
                    if (slotBlocks) {
                        const foundInSlot = findBlockAndPath(
                            slotBlocks,
                            blockId,
                            [...pathAccumulator, { block: block, slotName: slotName }],
                            slotName,
                        );
                        if (foundInSlot) {
                            return foundInSlot;
                        }
                    }
                }
            }
        }
        return null;
    };

    const updateParentChildrenRecursive = (
        currentBlocks: BlockData[],
        pathToTargetArray: { block: BlockData; slotName?: string }[],
        newArrayContent: BlockData[],
    ): BlockData[] => {
        if (pathToTargetArray.length === 0) {
            return newArrayContent;
        }

        const { block: currentParentInPath, slotName: slotToModifyWithinParent } =
            pathToTargetArray[0];
        const remainingPath = pathToTargetArray.slice(1);

        return currentBlocks.map((block) => {
            if (block.id === currentParentInPath.id) {
                if ("slots" in block && block.slots) {
                    const updatedSlots: Record<string, BlockData[]> = {
                        ...block.slots,
                    };

                    if (slotToModifyWithinParent) {
                        updatedSlots[slotToModifyWithinParent] =
                            updateParentChildrenRecursive(
                                block.slots[slotToModifyWithinParent] || [],
                                remainingPath,
                                newArrayContent,
                            );
                    } else {
                        console.warn(
                            `Block ID ${block.id} in path expects a slotName but none was provided for modification.`,
                        );
                    }
                    return { ...block, slots: updatedSlots } as BlockData;
                }
                console.warn(
                    `Block ID ${block.id} (${block.type}) found in path but does not have 'slots'.`,
                );
                return block;
            }
            return block;
        });
    };

    const handleUpdateBlocks = (newBlocks: BlockData[]) => {
        entryData.value = {
            ...entryData.value,
            blocks: newBlocks,
        };
    };

    const insertBlockAtPosition = markRaw(
        (newBlock: BlockData, position: { blockId: string | null; offset: number }) => {
            const currentBlocks = blocks.value;
            let newBlocksState: BlockData[];

            if (position.blockId === null) {
                newBlocksState = [...currentBlocks];
                if (position.offset === 0) {
                    newBlocksState.unshift(newBlock);
                } else {
                    newBlocksState.push(newBlock);
                }
            } else {
                const result = findBlockAndPath(currentBlocks, position.blockId);
                if (!result) {
                    console.warn(
                        `Block with ID ${position.blockId} not found for insertion.`,
                    );
                    handleUpdateBlocks(currentBlocks);
                    return;
                }

                const { path: fullPath, index, parentBlocks } = result;

                let blocksToModify: BlockData[];
                let pathToModifiedArray: PathSegment[];

                if (fullPath.length === 1) {
                    blocksToModify = currentBlocks;
                    pathToModifiedArray = [];
                } else {
                    const parentSegment = fullPath[fullPath.length - 2];
                    const containingSlotName = fullPath[fullPath.length - 1].slotName;

                    if (
                        parentSegment?.block &&
                        "slots" in parentSegment.block &&
                        parentSegment.block.slots &&
                        containingSlotName &&
                        containingSlotName in parentSegment.block.slots
                    ) {
                        blocksToModify = parentSegment.block.slots[containingSlotName];
                        pathToModifiedArray = [
                            ...fullPath.slice(0, fullPath.length - 2),
                            {
                                block: parentSegment.block,
                                slotName: containingSlotName,
                            },
                        ];
                    } else {
                        console.warn(
                            `Slot '${containingSlotName}' not found in parent of block ID ${position.blockId} or parent is missing. Falling back to inserting into parentBlocks.`,
                        );
                        blocksToModify = parentBlocks;
                        pathToModifiedArray = fullPath.slice(0, fullPath.length - 1);
                    }
                }

                const newBlocksArray = [...blocksToModify];
                newBlocksArray.splice(index + position.offset, 0, newBlock);

                newBlocksState = updateParentChildrenRecursive(
                    currentBlocks,
                    pathToModifiedArray,
                    newBlocksArray,
                );
            }
            handleUpdateBlocks(newBlocksState);
        },
    );

    const insertBlockIntoParent = markRaw(
        (newBlock: BlockData, parentId: string, slotName: string) => {
            const currentBlocks = blocks.value;
            const parentBlockInfo = findBlockAndPath(currentBlocks, parentId);
            if (!parentBlockInfo) {
                console.error(
                    `Parent block with ID ${parentId} not found for insertion.`,
                );
                handleUpdateBlocks(currentBlocks);
                return;
            }

            const parentBlock = parentBlockInfo.block;
            const updatedParentBlock = JSON.parse(JSON.stringify(parentBlock));

            if (
                !("slots" in updatedParentBlock) ||
                updatedParentBlock.slots === undefined ||
                updatedParentBlock.slots === null
            ) {
                updatedParentBlock.slots = {};
                console.warn(
                    `Parent block with ID ${parentId} had missing/null/undefined slots, initializing to empty object for insertion.`,
                );
            }

            const currentSlotBlocks = updatedParentBlock.slots[slotName] || [];
            const updatedSlotBlocks = [...currentSlotBlocks, newBlock];

            updatedParentBlock.slots = {
                ...updatedParentBlock.slots,
                [slotName]: updatedSlotBlocks,
            };

            const newBlocksState = updateBlockDataRecursive(currentBlocks, parentId, {
                slots: updatedParentBlock.slots,
            });

            handleUpdateBlocks(newBlocksState);
        },
    );

    const updateBlock = markRaw(
        (blockId: string, newData: Partial<BlockData>) => {
            const currentBlocks = blocks.value;
            const newBlocksState = updateBlockDataRecursive(
                currentBlocks,
                blockId,
                newData,
            );
            handleUpdateBlocks(newBlocksState);
        },
    );

    const duplicateBlock = markRaw((blockId: string) => {
        const currentBlocks = blocks.value;
        const blockInfo = findBlockAndPath(currentBlocks, blockId);
        if (!blockInfo) {
            console.error(`Block with ID ${blockId} not found for duplication.`);
            handleUpdateBlocks(currentBlocks);
            return;
        }

        const { block: originalBlock, path, index } = blockInfo;
        const duplicatedBlock = cloneBlockWithNewIds(originalBlock);

        let blocksToModify: BlockData[];
        let pathToModifiedArray: PathSegment[];

        if (path.length === 0) {
            console.error("Path is unexpectedly empty for a found block.");
            handleUpdateBlocks(currentBlocks);
            return;
        }

        if (path.length === 1) {
            blocksToModify = currentBlocks;
            pathToModifiedArray = [];
        } else {
            const targetBlockSegment = path[path.length - 1];
            if (!targetBlockSegment || !targetBlockSegment.block) {
                console.error(
                    "Target block segment or its block data is undefined in path.",
                );
                handleUpdateBlocks(currentBlocks);
                return;
            }

            const parentSegment = path[path.length - 2];
            if (!parentSegment || !parentSegment.block) {
                console.error(
                    "Parent segment or parent block data is undefined in path.",
                );
                handleUpdateBlocks(currentBlocks);
                return;
            }

            const containingSlotName = targetBlockSegment.slotName;

            if (!containingSlotName) {
                console.error("Containing slot name is undefined for nested block.");
                handleUpdateBlocks(currentBlocks);
                return;
            }

            const parentBlock = parentSegment.block;

            if (
                !("slots" in parentBlock) ||
                !parentBlock.slots ||
                !parentBlock.slots[containingSlotName]
            ) {
                console.error(
                    `Parent block ${parentBlock.id} of type ${parentBlock.type} does not have expected slot '${containingSlotName}'.`,
                );
                handleUpdateBlocks(currentBlocks);
                return;
            }

            blocksToModify = parentBlock.slots[containingSlotName];
            pathToModifiedArray = path.slice(0, -1);
        }

        const newBlocksArrayAfterDuplication = [...blocksToModify];
        newBlocksArrayAfterDuplication.splice(index + 1, 0, duplicatedBlock);

        const newBlocksState = updateParentChildrenRecursive(
            currentBlocks,
            pathToModifiedArray,
            newBlocksArrayAfterDuplication,
        );

        handleUpdateBlocks(newBlocksState);
    });

    const deleteBlock = markRaw((blockId: string) => {
        const currentBlocks = blocks.value;
        const newBlocksState = removeBlockRecursive(currentBlocks, blockId);
        handleUpdateBlocks(newBlocksState);
    });

    const replaceBlock = markRaw(
        (oldBlockId: string, newBlock: BlockData) => {
            const currentBlocks = blocks.value;
            const blockInfo = findBlockAndPath(currentBlocks, oldBlockId);
            if (!blockInfo) {
                console.error(`Block with ID ${oldBlockId} not found for replacement.`);
                handleUpdateBlocks(currentBlocks);
                return;
            }
            const { path, index, parentBlocks } = blockInfo;

            const newBlocksArrayInSlot = [...parentBlocks];
            newBlocksArrayInSlot[index] = newBlock;

            let newBlocksState: BlockData[];
            if (path.length === 1) {
                newBlocksState = newBlocksArrayInSlot;
            } else {
                const pathToParentContainingSlot = path.slice(0, -1);
                newBlocksState = updateParentChildrenRecursive(
                    currentBlocks,
                    pathToParentContainingSlot,
                    newBlocksArrayInSlot,
                );
            }
            handleUpdateBlocks(newBlocksState);
        },
    );

    const getParentBlockType = markRaw((blockId: string): string | undefined => {
        const result = findBlockAndPath(blocks.value, blockId);
        if (!result) {
            return undefined;
        }
        const path = result.path;
        if (path.length > 1) {
            const parentBlockInPath = path[path.length - 2]?.block;
            return parentBlockInPath?.type;
        }
        return undefined;
    });

    const getBlockElement = markRaw((blockId: string): HTMLElement | null => {
        return document.getElementById(blockId);
    });

    const isChildAllowedInParent = markRaw(
        (childBlockType: string, parentBlockType: string): boolean => {
            if (parentBlockType === "document-root") {
                return topLevelAllowedBlocks.includes(
                    childBlockType as BlockData["type"],
                );
            }

            const parentSchemaEntry =
                BlockSchema[parentBlockType as BlockData["type"]];
            if (!parentSchemaEntry || !parentSchemaEntry.nestable) {
                return false;
            }

            if (parentSchemaEntry.allowedChildren === undefined) {
                return true;
            }

            if (parentSchemaEntry.allowedChildren.length === 0) {
                return false;
            }

            return parentSchemaEntry.allowedChildren.includes(childBlockType);
        },
    );

    const handleEmptySlotClick = markRaw(
        (
            parentId: string,
            parentBlockType: string,
            position: { x: number; y: number },
            targetSlotName?: string | null,
        ) => {
            console.log("DocumentEditor: Empty slot clicked.", {
                parentId,
                parentBlockType,
                position,
                targetSlotName,
            });
            console.log(
                "DocumentEditor: handleEmptySlotClick received targetSlotName:",
                targetSlotName,
            );
            modalTriggerInfo.value = {
                parentId,
                parentBlockType,
                position,
                targetBlockId: null,
                insertPosition: "into",
                targetSlotName: targetSlotName,
            };
            searchTerm.value = "";
            focusedIndex.value = 0;

            console.log(
                "DocumentEditor: After setModalTriggerInfo call, the targetSlotName passed was:",
                targetSlotName,
            );
        },
    );

    const handleInsertBlockAbove = markRaw((blockId: string) => {
        console.log(
            "DocumentEditor: handleInsertBlockAbove triggered for blockId:",
            blockId,
        );
        const blockInfo = findBlockAndPath(blocks.value, blockId);
        if (!blockInfo) {
            console.error(
                `Block with ID ${blockId} not found for insertion above.`,
            );
            return;
        }

        const { parentId, parentBlockType, targetSlotName } =
            getParentInfoFromBlockPath(blockInfo.path);

        modalTriggerInfo.value = {
            parentId,
            parentBlockType,
            position: { x: 0, y: 0 },
            targetBlockId: blockId,
            insertPosition: "above",
            targetSlotName: targetSlotName,
        };
        searchTerm.value = "";
        focusedIndex.value = 0;
    });

    const handleInsertBlockBelow = markRaw((blockId: string) => {
        console.log(
            "DocumentEditor: handleInsertBlockBelow triggered for blockId:",
            blockId,
        );
        const blockInfo = findBlockAndPath(blocks.value, blockId);
        if (!blockInfo) {
            console.error(
                `Block with ID ${blockId} not found for insertion below.`,
            );
            return;
        }

        const { parentId, parentBlockType, targetSlotName } =
            getParentInfoFromBlockPath(blockInfo.path);

        modalTriggerInfo.value = {
            parentId,
            parentBlockType,
            position: { x: 0, y: 0 },
            targetBlockId: blockId,
            insertPosition: "below",
            targetSlotName: targetSlotName,
        };
        searchTerm.value = "";
        focusedIndex.value = 0;
    });

    const handlePlaceBlockSelect = markRaw((blockType: string) => {
        if (!(blockType in BlockSchema)) {
            console.error(
                `BlockSchema: No schema entry found for block type: ${blockType}`,
            );
            searchTerm.value = "";
            focusedIndex.value = 0;
            modalTriggerInfo.value = null;
            return;
        }

        const newBlock =
            BlockSchema[blockType as keyof typeof BlockSchema].create();

        console.log("DocumentEditor: Created new block:", newBlock);

        if (modalTriggerInfo.value) {
            console.log(
                "DocumentEditor: handleDebugBlockSelect - current modalTriggerInfo:",
                modalTriggerInfo.value,
            );

            const effectiveParentType =
                modalTriggerInfo.value.parentId === "document-root"
                    ? "document-root"
                    : modalTriggerInfo.value.parentBlockType;

            if (!isChildAllowedInParent(newBlock.type, effectiveParentType)) {
                editorCallbacks.showMessage(
                    `Cannot insert block type "${newBlock.type}" into "${effectiveParentType}".`,
                    "error",
                );
                console.warn(
                    `Insertion of block type "${newBlock.type}" into "${effectiveParentType}" is not allowed.`,
                );
                searchTerm.value = "";
                focusedIndex.value = 0;
                modalTriggerInfo.value = null;
                return;
            }

            if (modalTriggerInfo.value.insertPosition === "into") {
                console.log(
                    "DocumentEditor: Inserting block into parent:",
                    modalTriggerInfo.value.parentId,
                );
                const slotToInsertInto = modalTriggerInfo.value.targetSlotName || "default";
                insertBlockIntoParent(
                    newBlock,
                    modalTriggerInfo.value.parentId,
                    slotToInsertInto,
                );
            } else if (
                modalTriggerInfo.value.insertPosition === "above" &&
                modalTriggerInfo.value.targetBlockId
            ) {
                console.log(
                    "DocumentEditor: Inserting block above target:",
                    modalTriggerInfo.value.targetBlockId,
                );
                insertBlockAtPosition(newBlock, {
                    blockId: modalTriggerInfo.value.targetBlockId,
                    offset: 0,
                });
            } else if (
                modalTriggerInfo.value.insertPosition === "below" &&
                modalTriggerInfo.value.targetBlockId
            ) {
                console.log(
                    "DocumentEditor: Inserting block below target:",
                    modalTriggerInfo.value.targetBlockId,
                );
                insertBlockAtPosition(newBlock, {
                    blockId: modalTriggerInfo.value.targetBlockId,
                    offset: 1,
                });
            } else {
                console.warn(
                    "DocumentEditor: Unknown insert position or missing targetBlockId in modalTriggerInfo.",
                    modalTriggerInfo.value,
                );
            }
        } else {
            console.log(
                "DocumentEditor: Inserting block at end of document (no modalTriggerInfo).",
            );
            const lastBlock = blocks.value[blocks.value.length - 1];
            if (lastBlock) {
                insertBlockAtPosition(newBlock, { blockId: lastBlock.id, offset: 1 });
            } else {
                handleUpdateBlocks([newBlock]);
            }
        }

        searchTerm.value = "";
        focusedIndex.value = 0;
        modalTriggerInfo.value = null;
        console.log("DocumentEditor: Modal state cleared.");
    });

    const handleSearchTermChange = markRaw((newTerm: string) => {
        searchTerm.value = newTerm;
        focusedIndex.value = 0;
    });

    const allAvailableBlocks: ComputedRef<FlatBlockInfo[]> = computed(() =>
        Object.entries(BlockSchema).map(([type, entry]) => ({
            type: type as BlockData["type"],
            icon: entry.icon,
            category: entry.category,
            tooltip: entry.tooltip,
            displayName: entry.displayName,
        })),
    );

    const filteredAvailableBlocks: ComputedRef<FlatBlockInfo[]> = computed(() =>
        allAvailableBlocks.value.filter((block) => {
            const matchesSearchTerm =
                block.type.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                block.category.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                block.displayName
                    .toLowerCase()
                    .includes(searchTerm.value.toLowerCase()) ||
                block.tooltip.toLowerCase().includes(searchTerm.value.toLowerCase());

            if (!matchesSearchTerm) return false;

            if (modalTriggerInfo.value) {
                return isChildAllowedInParent(
                    block.type,
                    modalTriggerInfo.value.parentBlockType,
                );
            }
            return isChildAllowedInParent(block.type, "document-root");
        }),
    );

    const groupedBlocksForRendering: ComputedRef<GroupedBlocks> = computed(() =>
        filteredAvailableBlocks.value.reduce((acc, block) => {
            const category = block.category || "Other";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(block);
            return acc;
        }, {} as GroupedBlocks),
    );

    const entryDataToDebounceSave = ref<EntryData | null>(null);

    const debouncedEntryDataForSave = useDebounce(entryDataToDebounceSave, 1000);

    watch(
        debouncedEntryDataForSave,
        async (entryDataToSave) => {
            if (!isEditable) {
                console.log("Editor is not editable, skipping debounced save.");
                return;
            }
            if (!entryDataToSave?.slug) {
                console.warn("Cannot save: Entry slug is missing or debounced data is null.");
                // Only set error status if there was an attempt to save invalid data, not just initial null
                if (entryDataToSave !== null) {
                    saveStatus.value = "error";
                }
                return;
            }
            try {
                saveStatus.value = "saving";
                loading.value = true;
                console.log("Debounced save triggered for slug:", entryDataToSave.slug);
                await saveEntry(entryDataToSave);
                saveStatus.value = "saved";
                loading.value = false;
                console.log("Entry saved successfully!");
                setTimeout(() => (saveStatus.value = "idle"), 2000);
            } catch (err) {
                saveStatus.value = "error";
                loading.value = false;
                if (err instanceof Error) {
                    console.error("Error saving entry:", err.message);
                    error.value = "Failed to save entry content. Please try again.";
                } else {
                    console.error("Unknown error saving entry:", err);
                    error.value = "An unknown error occurred while saving.";
                }
                setTimeout(() => (saveStatus.value = "idle"), 3000);
            }
        },
        { deep: true }
    );

    watch(
        () => entryData.value,
        (newEntryData) => {
            if (isEditable && newEntryData) {
                entryDataToDebounceSave.value = { ...newEntryData };
            }
        },
        { deep: true }
    );

    const getAvailableCharactersForDialogue = markRaw(
        (dialogueBlockId: string): string[] => {
            const result = findBlockAndPath(blocks.value, dialogueBlockId);
            if (!result) {
                return [];
            }

            for (let i = result.path.length - 1; i >= 0; i--) {
                const currentBlockInPath = result.path[i].block;
                if (currentBlockInPath.type === "script") {
                    const scriptBlock = currentBlockInPath as ScriptBlockData;
                    return (scriptBlock.attrs?.characters || []) as string[];
                }
            }
            return [];
        },
    );

    const onCharacterRemovedFromScript = markRaw(
        (characterName: string, scriptBlockId: string) => {
            console.log(
                `DocumentEditor: Character "${characterName}" removed from ScriptBlock ${scriptBlockId}. Updating dialogue blocks...`,
            );

            let blocksChanged = false;

            const traverseAndUpdate = (
                blocksToTraverse: BlockData[],
            ): BlockData[] => {
                return blocksToTraverse.map((block) => {
                    if (block.type === "dialogue") {
                        const dialogueBlock = block as DialogueBlockData;

                        if (dialogueBlock.attrs?.character === characterName) {
                            blocksChanged = true;
                            return {
                                ...dialogueBlock,
                                attrs: {
                                    ...dialogueBlock.attrs,
                                    character: "",
                                },
                            } as DialogueBlockData;
                        }
                    }

                    if ("slots" in block && block.slots) {
                        let slotsUpdated = false;
                        const newSlots: Record<string, BlockData[]> = {};
                        for (const slotName in block.slots) {
                            if (Object.prototype.hasOwnProperty.call(block.slots, slotName)) {
                                const updatedSlotBlocks = traverseAndUpdate(
                                    block.slots[slotName] || [],
                                );
                                if (updatedSlotBlocks !== (block.slots[slotName] || [])) {
                                    slotsUpdated = true;
                                }
                                newSlots[slotName] = updatedSlotBlocks;
                            }
                        }
                        if (slotsUpdated) {
                            blocksChanged = true;
                            return { ...block, slots: newSlots } as BlockData;
                        }
                    }
                    return block;
                });
            };

            if (blocks.value) {
                const updatedBlocks = traverseAndUpdate(blocks.value);
                if (blocksChanged) {
                    console.log(
                        "DocumentEditor: Dialogue blocks updated after character removal.",
                    );
                    entryData.value = { ...entryData.value, blocks: updatedBlocks };
                }
            }
        },
    );

    const showMessage = markRaw(
        (message: string, type: "info" | "warning" | "error" | "success") => {
            console.log(`Message (${type}): ${message}`);
            if (type === "error") {
                error.value = message;
                setTimeout(() => (error.value = null), 5000);
            }
        },
    );

    const editorCallbacks: EditorCallbacks = markRaw({
        insertBlockAtPosition,
        updateBlock,
        duplicateBlock,
        deleteBlock,
        replaceBlock,
        getParentBlockType,
        getBlockElement,
        onEmptySlotClick: handleEmptySlotClick,
        onInsertBlockAbove: handleInsertBlockAbove,
        onInsertBlockBelow: handleInsertBlockBelow,
        getAvailableCharactersForDialogue,
        onCharacterRemovedFromScript,
        showMessage,
    });

    const handleMainEntryTitleChange = markRaw(
        (newValue: Array<TextNode | InlineNode>) => {
            const newTitleString = newValue
                .map((node) => {
                    if ("text" in node) {
                        return node.text;
                    }
                    return "";
                })
                .join("");

            entryData.value = {
                ...entryData.value,
                title: newTitleString,
            };
        },
    );

    return {
        entryData,
        blocks,
        saveStatus,
        error,
        displayLastModified,
        groupedBlocksForRendering,
        filteredAvailableBlocks,
        focusedIndex,
        searchTerm,
        entryTemplate,
        pathname,
        editorCallbacks,
        handleMainEntryTitleChange,
        handlePlaceBlockSelect,
        handleSearchTermChange,
    };
};