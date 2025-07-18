import { computed } from "vue";
import {
    RichTextContentEditor,
    htmlToContent,
    applyCharacterLimit,
} from "@/utils/contentUtils";
import type { InlineNode, TextNode, MarkType } from "@/types/blocks";
import type { Ref } from "vue";

interface UseRichTextEditorProps {
    normalizedValue: Ref<Array<TextNode | InlineNode>>;
    supportedMarks: MarkType[];
    onValueChange: (newValue: Array<TextNode | InlineNode>) => void;
    characterLimit?: number;
}

export const useRichTextEditor = ({
                                      normalizedValue,
                                      supportedMarks,
                                      onValueChange,
                                      characterLimit,
                                  }: UseRichTextEditorProps) => {
    const contentEditor = computed(
        () => new RichTextContentEditor(normalizedValue.value, supportedMarks),
    );

    const applyMarkToSelection = (
        markType: MarkType,
        attrs?: Record<string, unknown>,
    ): void => {

        const newContent = contentEditor.value.applyMark(
            markType,
            attrs
        );

        onValueChange(newContent);
    };

    const insertContentAtCaret = (
        contentToInsert: Array<TextNode | InlineNode>,
    ) => {
        const finalContent = contentEditor.value.insertContent(
            contentToInsert,
        );

        let limitedContent = finalContent;
        let newLength = finalContent.reduce(
            (acc, node) => acc + (node.type === "text" ? node.text.length : 1),
            0,
        );

        if (characterLimit !== undefined) {
            const result = applyCharacterLimit(finalContent, characterLimit);
            limitedContent = result.limitedContent;
            newLength = result.newLength;
        }

        onValueChange(limitedContent);

        return { limitedContent, newLength };
    };

    const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const selectedTextInDOM = selection.toString();
        const urlRegex = /^(https?:\/\/[^\s$.?#].\S*)$/i;

        let pastedContentArray: Array<TextNode | InlineNode>;

        if (
            urlRegex.test(e.clipboardData?.getData("text/plain") || "") &&
            selectedTextInDOM.length > 0
        ) {
            applyMarkToSelection("link", {
                url: e.clipboardData?.getData("text/plain"),
            });
            return;
        } else if (
            urlRegex.test(e.clipboardData?.getData("text/plain") || "") &&
            selectedTextInDOM.length === 0
        ) {
            pastedContentArray = [
                {
                    type: "text",
                    text: e.clipboardData?.getData("text/plain") || "",
                    marks: [
                        {
                            type: "link",
                            attrs: { url: e.clipboardData?.getData("text/plain") || "" },
                        },
                    ],
                },
            ];
        } else if (e.clipboardData?.getData("text/html")) {
            pastedContentArray = htmlToContent(e.clipboardData.getData("text/html"));
        } else {
            pastedContentArray = [
                {
                    type: "text",
                    text: e.clipboardData?.getData("text/plain") || "",
                    marks: [],
                },
            ];
        }

        insertContentAtCaret(
            pastedContentArray
        );
    };

    return {
        contentEditor,
        applyMarkToSelection,
        insertContentAtCaret,
        handlePaste,
    };
};