import { ref } from "vue";
import type { Ref } from "vue";
import type { MarkType } from "@/types/blocks";

interface UseLinkInteractionProps {
    textRef: Ref<HTMLElement | null>;
    isEditable: Ref<boolean>;
    onApplyMark: (markType: MarkType, attrs?: Record<string, unknown>) => void;
}

export const useLinkInteraction = ({
                                       textRef,
                                       onApplyMark,
                                   }: UseLinkInteractionProps) => {
    const isEditingLink = ref(false);
    const editedUrl = ref("");
    const editedText = ref("");
    const currentUrl = ref("");
    const showLinkTooltip = ref(false);
    const activeLinkElement: Ref<HTMLElement | null> = ref(null);

    // A timeout to delay hiding the tooltip, allowing for smooth transitions
    let hideTooltipTimeout: NodeJS.Timeout | null = null;

    const handleContentEditableMouseOver = (e: MouseEvent) => {
        // Clear any pending hide timeouts
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
            hideTooltipTimeout = null;
        }

        const target = e.target as HTMLElement;
        // Check if the mouse is over the content editable itself or a child of it
        const isOverContentEditable = textRef.value?.contains(target) || target === textRef.value;
        const linkElement = isOverContentEditable ? target.closest("a") : null;

        if (linkElement && !linkElement.hasAttribute("data-entry-id")) {
            // If a new link is hovered, update activeLinkElement and show tooltip
            if (activeLinkElement.value !== linkElement) {
                activeLinkElement.value = linkElement;
                currentUrl.value = linkElement.getAttribute("href") || "";
                if (!isEditingLink.value) {
                    showLinkTooltip.value = true;
                }
            }
        } else {
            if (!isEditingLink.value && showLinkTooltip.value) {
                hideTooltipTimeout = setTimeout(() => {
                    showLinkTooltip.value = false;
                    activeLinkElement.value = null;
                    currentUrl.value = "";
                }, 100);
            }
        }
    };

    const handleContentEditableMouseLeave = () => {
        if (!isEditingLink.value) {
            hideTooltipTimeout = setTimeout(() => {
                showLinkTooltip.value = false;
                activeLinkElement.value = null;
                currentUrl.value = "";
            }, 100);
        }
    };

    const handleCopyLink = () => {
        if (activeLinkElement.value) {
            navigator.clipboard.writeText(activeLinkElement.value.getAttribute("href") || "");
        }
        showLinkTooltip.value = false;
        activeLinkElement.value = null;
        currentUrl.value = "";
    };

    const handleEditLinkClick = () => {
        if (activeLinkElement.value) {
            const url = activeLinkElement.value.getAttribute("href") || "";
            const text = activeLinkElement.value.textContent || "";
            editedUrl.value = url;
            editedText.value = text;
            isEditingLink.value = true;
            showLinkTooltip.value = true;
        }
    };

    const handleUnlink = () => {
        if (!textRef.value) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        const range = selection.getRangeAt(0);

        if (
            activeLinkElement.value &&
            range.intersectsNode(activeLinkElement.value)
        ) {
            const tempRange = document.createRange();
            tempRange.selectNodeContents(textRef.value);
            tempRange.setEnd(activeLinkElement.value, 0);
            onApplyMark("link", { url: null, text: null });
        } else {
            onApplyMark("link", { url: null, text: null });
        }

        showLinkTooltip.value = false;
        isEditingLink.value = false;
        activeLinkElement.value = null;
        currentUrl.value = "";
    };

    const handleSaveLink = () => {
        if (!textRef.value) return;

        const urlToSave = editedUrl.value.trim();
        const textToSave = editedText.value.trim();

        if (activeLinkElement.value) {
            if (urlToSave) {
                const tempRange = document.createRange();
                tempRange.selectNodeContents(textRef.value);
                tempRange.setEnd(activeLinkElement.value, 0);

                onApplyMark("link", { url: urlToSave, text: textToSave || urlToSave });
            } else {
                handleUnlink();
            }
        } else {
            onApplyMark("link", { url: urlToSave, text: textToSave || urlToSave });
        }

        isEditingLink.value = false;
        showLinkTooltip.value = false;
        activeLinkElement.value = null;
        currentUrl.value = "";
    };

    const handleLinkTooltipVisibilityChange = (newVisibility: boolean) => {
        showLinkTooltip.value = newVisibility;
        if (!newVisibility) {
            isEditingLink.value = false;
            activeLinkElement.value = null;
            currentUrl.value = "";
        }
    };

    const handleCancelLinkEdit = () => {
        isEditingLink.value = false;
        showLinkTooltip.value = false;
        activeLinkElement.value = null;
        currentUrl.value = "";
        if (textRef.value) {
            textRef.value.focus();
            const selection = window.getSelection();
            selection?.collapseToEnd();
        }
    };

    const handleLinkInputConfirm = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveLink();
        }
    };

    return {
        isEditingLink,
        editedUrl,
        editedText,
        currentUrl,
        showLinkTooltip,
        activeLinkElement,
        handleContentEditableMouseOver,
        handleContentEditableMouseLeave,
        handleCopyLink,
        handleEditLinkClick,
        handleUnlink,
        handleSaveLink,
        handleLinkTooltipVisibilityChange,
        handleCancelLinkEdit,
        handleLinkInputConfirm,
    };
};