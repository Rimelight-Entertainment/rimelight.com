<script setup lang="ts">
import { ref, computed } from 'vue';
import type { BlockData } from '~/types/blocks';
import { useRenderBlocks } from '~/composables/useRenderBlocks';
import type { EditorCallbacks } from '~/config/blocks/blockSchema';
import BlockSchema from '~/config/blocks/blockSchema';

interface BlockSlotProps {
  blocks: BlockData[];
  isEditable: boolean;
  editorCallbacks?: EditorCallbacks;
  className?: string;
  allowedBlocks?: string[];
  parentId: string;
  parentBlockType: string;
  parentNestingLevel?: number;
  draggedBlockType: string | null;
  isChildAllowedInParent: (childType: string, parentType: string) => boolean;
  slotName?: string;
}

const props = withDefaults(defineProps<BlockSlotProps>(), {
  parentNestingLevel: 0,
  editorCallbacks: () => ({
    onDragEnd: () => {},
    isChildAllowedInParent: () => true,
    onDrop: () => {},
    insertBlockIntoParent: () => {},
    insertBlockAtPosition: () => {},
    onEmptySlotClick: () => {},
  }) as EditorCallbacks,
  className: '',
  allowedBlocks: () => [],
  slotName: 'default',
});

const isDraggingOverSlot = ref(false);
const containerDropPosition = ref<'into' | 'before' | 'after' | null>(null);
const targetBlockId = ref<string | null>(null);
const indicatorPixelTop = ref<number | null>(null);

const blockSlotRef = ref<HTMLButtonElement | HTMLDivElement | null>(null);

const childrenNestingLevel = computed(() => props.parentNestingLevel + 1);
const blocksToRender = computed(() =>
    props.blocks.filter((block) => block !== null && block !== undefined)
);
const isSlotEmpty = computed(() => blocksToRender.value.length === 0);
// --- TypeScript Fix: Use props.isEditable directly, as it's a boolean prop, not a ref ---
const showPlaceholder = computed(() => props.isEditable && isSlotEmpty.value);

const isChildAllowed = (childType: string) => {
  if (!(childType in BlockSchema)) {
    console.warn(
        `BlockSchema: No schema entry found for block type: ${childType}`,
    );
    return false;
  }
  const schemaEntry = BlockSchema[childType as keyof typeof BlockSchema];
  if (!schemaEntry) {
    return false;
  }
  const isAllowedByParent = props.isChildAllowedInParent(
      childType,
      props.parentBlockType,
  );
  const isAllowedBySlot =
      props.allowedBlocks === undefined || props.allowedBlocks.includes(childType);
  return isAllowedByParent && isAllowedBySlot;
};

const INDICATOR_OFFSET = 6;

const isDragInvalid = computed(
    () =>
        // --- TypeScript Fix: Use props.isEditable directly ---
        props.isEditable &&
        props.draggedBlockType !== null &&
        !props.isChildAllowedInParent(
            props.draggedBlockType,
            props.parentBlockType,
        ),
);

const draggedBlockDisplayName = computed(() => {
  if (props.draggedBlockType && props.draggedBlockType in BlockSchema) {
    return BlockSchema[props.draggedBlockType as keyof typeof BlockSchema]
        ?.displayName || 'Unknown Block';
  }
  return 'Unknown Block';
});

const parentBlockDisplayName = computed(() => {
  if (props.parentBlockType in BlockSchema) {
    return (
        BlockSchema[props.parentBlockType as keyof typeof BlockSchema]?.displayName ||
        'Unknown Parent Block'
    );
  }
  return 'Unknown Parent Block';
});

const handleDragEnter = (event: DragEvent) => {
  event.stopPropagation();
  // --- TypeScript Fix: Use props.isEditable directly ---
  if (props.isEditable && props.draggedBlockType && isChildAllowed(props.draggedBlockType)) {
    isDraggingOverSlot.value = true;
  }
};

const handleDragLeave = (event: DragEvent) => {
  event.stopPropagation();
  const targetElement = event.relatedTarget as HTMLElement;
  if (blockSlotRef.value && !blockSlotRef.value.contains(targetElement)) {
    isDraggingOverSlot.value = false;
    containerDropPosition.value = null;
    targetBlockId.value = null;
    indicatorPixelTop.value = null;
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';

  if (!isDraggingOverSlot.value) {
    isDraggingOverSlot.value = true;
  }

  if (blockSlotRef.value) {
    const rect = blockSlotRef.value.getBoundingClientRect();
    const mouseY = event.clientY;

    let currentDropPosition: 'before' | 'after' | 'into' | null = null;
    let currentTargetBlockId: string | null = null;
    let calculatedIndicatorTop: number | null = null;

    if (blocksToRender.value.length === 0) {
      currentDropPosition = 'into';
      currentTargetBlockId = props.parentId;
      calculatedIndicatorTop = rect.height / 2 - 0.5;
    } else {
      let foundDropZone = false;

      const childElements = blocksToRender.value
          .map((block) => document.getElementById(block.id))
          .filter(Boolean) as HTMLElement[];

      if (childElements.length > 0) {
        const firstBlockElement = childElements[0];
        const firstBlockRect = firstBlockElement.getBoundingClientRect();
        if (mouseY < firstBlockRect.top + firstBlockRect.height / 2) {
          currentDropPosition = 'before';
          currentTargetBlockId = blocksToRender.value[0].id;
          calculatedIndicatorTop = firstBlockRect.top - rect.top - INDICATOR_OFFSET;
          foundDropZone = true;
        }
      }

      if (!foundDropZone) {
        for (let i = 0; i < childElements.length - 1; i++) {
          const currentBlockElement = childElements[i];
          const nextBlockElement = childElements[i + 1];

          const currentBlockRect = currentBlockElement.getBoundingClientRect();
          const nextBlockRect = nextBlockElement.getBoundingClientRect();
          const spaceTop = currentBlockRect.bottom;
          const spaceBottom = nextBlockRect.top;

          if (mouseY >= spaceTop && mouseY <= spaceBottom) {
            currentDropPosition = 'after';
            currentTargetBlockId = blocksToRender.value[i].id;
            calculatedIndicatorTop = currentBlockRect.bottom - rect.top + INDICATOR_OFFSET;
            foundDropZone = true;
            break;
          }
        }
      }

      if (!foundDropZone && childElements.length > 0) {
        const lastBlockElement = childElements[childElements.length - 1];
        const lastBlockRect = lastBlockElement.getBoundingClientRect();
        if (mouseY > lastBlockRect.top + lastBlockRect.height / 2) {
          currentDropPosition = 'after';
          currentTargetBlockId = blocksToRender.value[blocksToRender.value.length - 1].id;
          calculatedIndicatorTop = lastBlockRect.bottom - rect.top + INDICATOR_OFFSET;
        }
      }
    }
    containerDropPosition.value = currentDropPosition;
    targetBlockId.value = currentTargetBlockId;
    indicatorPixelTop.value = calculatedIndicatorTop;
  }
  props.editorCallbacks?.onDragOver?.(event);
};

const handleKeydownEmptySlot = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleEmptySlotClickInternal();
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  isDraggingOverSlot.value = false;
  containerDropPosition.value = null;
  targetBlockId.value = null;
  indicatorPixelTop.value = null;

  if (
      !props.isEditable ||
      !props.draggedBlockType ||
      !isChildAllowed(props.draggedBlockType)
  ) {
    return;
  }

  const draggedId = event.dataTransfer!.getData('text/plain');

  if (draggedId) {
    props.editorCallbacks?.onDrop?.(
        event,
        targetBlockId.value,
        containerDropPosition.value,
        props.slotName,
    );
  } else {
    if (!(props.draggedBlockType in BlockSchema)) {
      console.warn(
          `BlockSlot: Dropped an unknown block type: ${props.draggedBlockType}`,
      );
      return;
    }
    const draggedBlockSchema =
        BlockSchema[props.draggedBlockType as keyof typeof BlockSchema];
    const newBlock = draggedBlockSchema.create();

    const finalDropPosition = containerDropPosition.value;
    const finalTargetBlockId = targetBlockId.value;

    if (finalDropPosition === 'into') {
      props.editorCallbacks?.insertBlockIntoParent?.(
          newBlock,
          props.parentId,
          props.slotName || 'default',
      );
    } else if (finalDropPosition && finalTargetBlockId) {
      props.editorCallbacks?.insertBlockAtPosition?.(
          newBlock,
          {
            blockId: finalTargetBlockId,
            offset: finalDropPosition === 'after' ? 1 : 0,
          },
          props.slotName,
      );
    }
  }
};

const handleEmptySlotClickInternal = () => {
  console.log(
      // --- TypeScript Fix: Use props.isEditable directly ---
      `BlockSlot ${props.parentId}: Empty slot clicked/keyed! isEditable=${props.isEditable}, isSlotEmpty=${isSlotEmpty.value}`,
  );
  if (props.editorCallbacks) {
    console.log(
        `BlockSlot ${props.parentId}: editorCallbacks is defined. Checking onEmptySlotClick.`,
    );
    if (props.editorCallbacks.onEmptySlotClick) {
      const rect = blockSlotRef.value?.getBoundingClientRect();
      if (rect) {
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        console.log(
            `BlockSlot ${props.parentId}: About to call onEmptySlotClick with slotName:`,
            props.slotName,
        );
        props.editorCallbacks.onEmptySlotClick(
            props.parentId,
            props.parentBlockType,
            { x, y },
            props.slotName || 'default',
        );
      } else {
        console.warn(
            `BlockSlot ${props.parentId}: Could not get bounding client rect for blockSlotRef.`,
        );
      }
    } else {
      console.warn(
          `BlockSlot ${props.parentId}: editorCallbacks.onEmptySlotClick is not defined.`,
      );
    }
  } else {
    console.warn(`BlockSlot ${props.parentId}: editorCallbacks is undefined.`);
  }
};

// --- Computed classes for styling ---
const indicatorColorClass = computed(() =>
    isDragInvalid.value ? 'bg-rimelight-danger-500' : 'bg-rimelight-success-500'
);
const borderColorClass = computed(() =>
    isDragInvalid.value ? 'border-rimelight-danger-500' : 'border-rimelight-success-500'
);
const bgColorClass = computed(() =>
    isDragInvalid.value ? 'bg-rimelight-danger-700' : 'bg-rimelight-success-700'
);

const betweenBlocksIndicatorClasses = computed(() => [
  'absolute left-0 right-0 h-1 z-20 pointer-events-none',
  indicatorColorClass.value,
  isDraggingOverSlot.value &&
  (containerDropPosition.value === 'before' || containerDropPosition.value === 'after') &&
  targetBlockId.value
      ? ''
      : 'hidden',
]);

const emptySlotIndicatorClasses = computed(() => [
  'border p-lg flex items-center justify-center',
  props.className || '',
  isDraggingOverSlot.value && containerDropPosition.value === 'into'
      ? isDragInvalid.value
          ? `${borderColorClass.value} ${bgColorClass.value} text-rimelight-danger-100 border-solid`
          : `${borderColorClass.value} ${bgColorClass.value} text-rimelight-success-100 border-solid`
      : 'border-rimelight-primary-500 border-dashed text-rimelight-primary-500 hover:bg-rimelight-primary-700',
]);

</script>

<template>
  <template v-if="!props.isEditable && isSlotEmpty && !isDraggingOverSlot">
    {{
      (() => {
        console.log(
            `BlockSlot ${props.parentId} (Render): Returning null due to conditions.`
        );
        return '';
      })()
    }}
  </template>
  <button
      v-else-if="showPlaceholder"
      ref="blockSlotRef"
      type="button"
      :class="emptySlotIndicatorClasses"
      aria-label="Empty block slot"
      data-is-block-slot="true"
      @dragover="props.isEditable ? handleDragOver : undefined"
      @drop="props.isEditable ? handleDrop : undefined"
      @dragenter="props.isEditable ? handleDragEnter : undefined"
      @dragleave="props.isEditable ? handleDragLeave : undefined"
      @click="() => {
        console.log(
          `BlockSlot ${props.parentId} (Click): Raw click event detected! isEditable=${props.isEditable}, isSlotEmpty=${isSlotEmpty}`
        );
        handleEmptySlotClickInternal();
      }"
      @keydown="handleKeydownEmptySlot"
  >
    {{
      isDraggingOverSlot && containerDropPosition === 'into'
          ? isDragInvalid
              ? `Cannot nest ${draggedBlockDisplayName} in ${parentBlockDisplayName}`
              : `Nest ${draggedBlockDisplayName} in ${parentBlockDisplayName}`
          : 'Drag and drop blocks here or click to add'
    }}
  </button>
  <div
      v-else
      ref="blockSlotRef"
      :class="['relative flex w-full flex-col gap-lg', props.className || '']"
      data-is-block-slot="true"
      @dragover="props.isEditable ? handleDragOver : undefined"
      @drop="props.isEditable ? handleDrop : undefined"
      @dragenter="props.isEditable ? handleDragEnter : undefined"
      @dragleave="props.isEditable ? handleDragLeave : undefined"
  >
    <div
        v-if="
        isDraggingOverSlot &&
        (containerDropPosition === 'before' || containerDropPosition === 'after') &&
        targetBlockId &&
        indicatorPixelTop !== null
      "
        :class="betweenBlocksIndicatorClasses"
        :style="{ top: `${indicatorPixelTop}px` }"
    />
    <component
        :is="useRenderBlocks(
      blocksToRender,
      props.isEditable,
      props.editorCallbacks,
      childrenNestingLevel,
      props.draggedBlockType,
      props.isChildAllowedInParent
    )" />
  </div>
</template>