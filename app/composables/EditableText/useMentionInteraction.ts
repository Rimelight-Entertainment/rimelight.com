import { ref, watch, nextTick } from "vue";
import type { Ref } from "vue";
import type { InlineNode, TextNode, Mark } from "@/types/blocks";
import { RichTextContentEditor } from "@/utils/contentUtils";

interface UseMentionInteractionProps {
    textRef: Ref<HTMLElement | null>;
    onValueChange: (newValue: Array<TextNode | InlineNode>) => void;
    normalizedValue: Ref<Array<TextNode | InlineNode>>;
    editorCallbacks?: {
        onOpenMentionSearch?: (searchTerm: string, position: { top: number; left: number }) => void;
        onCloseMentionSearch?: () => void;
    };
}

export const useMentionInteraction = ({
                                          textRef,
                                          onValueChange,
                                          normalizedValue,
                                          editorCallbacks,
                                      }: UseMentionInteractionProps) => {
    const showMentionSearch = ref(false);
    const mentionSearchTerm = ref("");
    const mentionPosition = ref<{ top: number; left: number } | null>(null);
    const mentionStartIndexRef = ref<number | null>(null);

    const calculateMentionSearchPosition = () => {
        if (!textRef.value) return null;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const parentRect = textRef.value.getBoundingClientRect();

        const top = rect.bottom - parentRect.top;
        const left = rect.left - parentRect.left;

        return { top, left };
    };

    const handleMentionInput = () => {
        if (!textRef.value) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            let currentNode: Node | null = range.startContainer;
            while (currentNode && currentNode !== textRef.value) {
                // Check if the current caret position is inside an existing mention SPAN (which is rendered by the mark)
                if (
                    currentNode.nodeType === Node.ELEMENT_NODE &&
                    (currentNode as HTMLElement).classList.contains("mention") &&
                    (currentNode as HTMLElement).tagName === 'SPAN' // Assuming a span is used for mentions
                ) {
                    showMentionSearch.value = false;
                    mentionSearchTerm.value = "";
                    mentionStartIndexRef.value = null;
                    return;
                }
                currentNode = currentNode.parentNode;
            }

            const textBeforeCaret = (textRef.value.textContent || "").substring(
                0,
            );
            const lastAtIndex = textBeforeCaret.lastIndexOf("@");

            if (lastAtIndex !== -1) {
                const potentialMentionText = textBeforeCaret.substring(lastAtIndex + 1);

                const charBeforeAt = lastAtIndex > 0 ? textBeforeCaret[lastAtIndex - 1] : "";
                const isStartOfMention =
                    lastAtIndex === 0 || /\s/.test(charBeforeAt);

                if (isStartOfMention && !/\s/.test(potentialMentionText)) {
                    mentionSearchTerm.value = potentialMentionText;
                    mentionStartIndexRef.value = lastAtIndex;
                    showMentionSearch.value = true;
                    const pos = calculateMentionSearchPosition();
                    if (pos) {
                        mentionPosition.value = pos;
                        editorCallbacks?.onOpenMentionSearch?.(potentialMentionText, pos);
                    }
                    return;
                }
            }
        }

        handleCloseMentionSearch();
    };

    const handleSelectMentionEntry = (
        entryTitle: string,
        entryId: string,
        url: string,
    ) => {
        if (mentionStartIndexRef.value === null || !textRef.value) return;

        const currentContent = normalizedValue.value;
        const editor = new RichTextContentEditor(currentContent, []); // supportedMarks array is for RichTextContentEditor's internal use for marks

        // Construct the TextNode with the mention text and the 'mention' mark
        const mentionTextNode: TextNode = {
            type: "text",
            text: `@${entryTitle}`,
            marks: [
                {
                    type: "mention",
                    attrs: { id: entryId, label: entryTitle, url: url },
                } as Mark, // Assert as Mark to satisfy type inference with discriminated union
            ],
        };

        // Calculate the start and end of the text to be replaced (the '@' and the search term)
        const startIndex = mentionStartIndexRef.value;
        const endIndex =
            mentionStartIndexRef.value + 1 + mentionSearchTerm.value.length; // +1 for '@'

        // Use insertContent to replace the '@mentionTerm' with the mention TextNode and a space
        const newContent = editor.insertContent(
            [mentionTextNode, { type: "text", text: " " }], // Insert the mention TextNode and a trailing space
            startIndex,
            endIndex
        );

        onValueChange(newContent);

        nextTick(() => {
            handleCloseMentionSearch();
        });
    };

    const handleCloseMentionSearch = () => {
        showMentionSearch.value = false;
        mentionSearchTerm.value = "";
        mentionStartIndexRef.value = null;
        editorCallbacks?.onCloseMentionSearch?.();

        if (textRef.value) {
            nextTick(() => {
                if (textRef.value) {
                        textRef.value.focus();
                        const selection = window.getSelection();
                        selection?.collapseToEnd();
                }
            });
        }
    };

    const handleMentionKeyDown = (e: KeyboardEvent) => {
        if (showMentionSearch.value) {
            if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === "Backspace" && mentionSearchTerm.value.length === 0) {
                showMentionSearch.value = false;
                mentionSearchTerm.value = "";
                mentionStartIndexRef.value = null;
                e.preventDefault();
            }
        }
    };

    watch(normalizedValue, () => {
    }, { deep: true });

    return {
        showMentionSearch,
        mentionSearchTerm,
        mentionPosition,
        mentionStartIndexRef,
        handleMentionInput,
        handleSelectMentionEntry,
        handleCloseMentionSearch,
        handleMentionKeyDown,
    };
};