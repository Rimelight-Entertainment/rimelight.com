import { ref, watch, onMounted, computed, nextTick } from "vue";
import {
    stringToTextNodeArray,
    contentToHtml,
    htmlToContent,
    applyCharacterLimit,
} from "@/utils/contentUtils";
import type { TextNode, InlineNode } from "@/types/blocks";
import type { Ref } from "vue";

interface UseContentEditableProps {
    value: string | Array<TextNode | InlineNode>;
    isEditable: Ref<boolean>;
    placeholder?: string;
    characterLimit?: number;
    isMultiline?: boolean;
    onValueChange: (newValue: Array<TextNode | InlineNode>) => void;
}

export const useContentEditable = ({
                                       value,
                                       isEditable,
                                       placeholder,
                                       characterLimit,
                                       isMultiline,
                                       onValueChange,
                                   }: UseContentEditableProps) => {
    const textRef = ref<HTMLDivElement | null>(null);
    const showPlaceholder = ref(false);
    const currentLength = ref(0);

    const normalizedValue = computed(() => {
        if (typeof value === "string") {
            return stringToTextNodeArray(value);
        }
        return value;
    });

    const updateDomFromValue = () => {
        // Ensure this code only runs in a browser environment
        if (typeof document === 'undefined' || !textRef.value) return;

        const currentTextContent = textRef.value.textContent || "";
        const isCurrentlyFocused = document.activeElement === textRef.value;

        const isValueEmpty =
            !normalizedValue.value ||
            normalizedValue.value.length === 0 ||
            (normalizedValue.value.length === 1 &&
                normalizedValue.value[0].type === "text" &&
                normalizedValue.value[0].text === "");

        const shouldShowPlaceholder = Boolean(
            isValueEmpty && placeholder && !isCurrentlyFocused,
        );

        showPlaceholder.value = shouldShowPlaceholder;

        if (shouldShowPlaceholder) {
            if (currentTextContent !== (placeholder || "")) {
                textRef.value.textContent = placeholder || "";
            }
            currentLength.value = 0;
            const selection = window.getSelection();
            if (selection && textRef.value.contains(selection.anchorNode)) {
                selection.removeAllRanges();
            }
        } else {
            const htmlFromValue = contentToHtml(normalizedValue.value);

            if (isEditable.value || textRef.value.innerHTML !== htmlFromValue) {
                textRef.value.innerHTML = htmlFromValue;
            }

            currentLength.value = textRef.value.textContent?.length || 0;
        }
    };

    watch(
        () => normalizedValue.value,
        () => {
            if (typeof document !== 'undefined') {
                if (document.activeElement !== textRef.value) {
                    updateDomFromValue();
                }
            }
        },
        { deep: true },
    );

    onMounted(() => {
        void nextTick(() => {
            updateDomFromValue();
        });
    });

    const handleInputInternal = () => {
        if (!textRef.value) return;

        let currentHtml = textRef.value.innerHTML;
        if (currentHtml === "<br>" || currentHtml.trim() === "") {
            currentHtml = "";
        }

        const newContentFromHtml = htmlToContent(currentHtml);

        let limitedContent = newContentFromHtml;
        let newLength = newContentFromHtml.reduce(
            (acc, node) => acc + (node.type === "text" ? node.text.length : 1),
            0,
        );

        if (characterLimit !== undefined) {
            const result = applyCharacterLimit(newContentFromHtml, characterLimit);
            limitedContent = result.limitedContent;
            newLength = result.newLength;
        }

        onValueChange(limitedContent);
        currentLength.value = newLength;
    };

    const handleFocusInternal = () => {
        if (showPlaceholder.value && textRef.value) {
            textRef.value.textContent = "";
        }
        showPlaceholder.value = false;
    };

    const handleBlurInternal = () => {
        if (!textRef.value) {
            return;
        }

        const isEmptyContent =
            !normalizedValue.value ||
            normalizedValue.value.length === 0 ||
            (normalizedValue.value.length === 1 &&
                normalizedValue.value[0].type === "text" &&
                normalizedValue.value[0].text === "");

        const shouldShowPlaceholder = Boolean(
            isEmptyContent && placeholder && isEditable.value,
        );

        showPlaceholder.value = shouldShowPlaceholder;

        if (shouldShowPlaceholder) {
            if (textRef.value.textContent !== (placeholder || "")) {
                textRef.value.textContent = placeholder || "";
            }
            currentLength.value = 0;
        } else {
            currentLength.value = textRef.value.textContent?.length || 0;
        }
    };

    const handleKeyDownInternal = (e: KeyboardEvent) => {
        if (!isEditable.value) {
            e.preventDefault();
            return;
        }

        if (!isMultiline && e.key === "Enter") {
            e.preventDefault();
        }

        if (characterLimit !== undefined && currentLength.value >= characterLimit) {
            const selection = window.getSelection();
            if (
                selection?.isCollapsed &&
                e.key.length === 1 &&
                !e.altKey &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.key.startsWith("Arrow") &&
                e.key !== "Backspace" &&
                e.key !== "Delete"
            ) {
                e.preventDefault();
            }
        }
    };

    return {
        textRef,
        normalizedValue,
        currentLength,
        showPlaceholder,
        handleInput: handleInputInternal,
        handleFocus: handleFocusInternal,
        handleBlur: handleBlurInternal,
        handleKeyDown: handleKeyDownInternal,
        updateDomFromValue,
    };
};