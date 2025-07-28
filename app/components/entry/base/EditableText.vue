<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDebounce } from '~/composables/useDebounce';

import { useContentEditable } from '~/composables/EditableText/useContentEditable';
import { useLinkInteraction } from '~/composables/EditableText/useLinkInteraction';
import { useMentionInteraction } from '~/composables/EditableText/useMentionInteraction';
import { useRichTextEditor } from '~/composables/EditableText/useRichTextEditor';

import type { InlineNode, TextNode, MarkType } from '~/types/blocks';

import Tooltip from '~/components/basic/base/Tooltip.vue';
import LinkEditModal from '~/components/entry/tooltips/LinkEditModal.vue';
import MentionSearch from '~/components/entry/MentionSearch.vue';
import LinkTooltip from '~/components/entry/tooltips/LinkTooltip.vue';
import ReadOnlyText from './ReadOnlyText.vue';
import LayoutBox from "~/components/basic/base/LayoutBox.vue";

interface EditorCallbacksForMention {
  onOpenMentionSearch?: (searchTerm: string, position: { top: number; left: number }) => void;
  onCloseMentionSearch?: () => void;
}

interface EditableTextProps {
  value: string | Array<TextNode | InlineNode>;
  onValueChange: (newValue: Array<TextNode | InlineNode>) => void;
  isEditable: boolean;
  placeholder?: string;
  characterLimit?: number;
  isMultiline?: boolean;
  className?: string;
  supportedMarks?: MarkType[];
  rootTag?: keyof HTMLElementTagNameMap;
  editorCallbacks?: EditorCallbacksForMention;
}

const props = withDefaults(defineProps<EditableTextProps>(), {
  isMultiline: false,
  rootTag: 'p',
  placeholder: undefined,
  characterLimit: undefined,
  className: '',
  supportedMarks: undefined,
  editorCallbacks: undefined,
});

const emit = defineEmits<{
  (e: 'update:modelValue' | 'valueChange', newValue: Array<TextNode | InlineNode>): void;
}>();

const DEBOUNCE_SAVE_DELAY = 300;

// Explicitly type newValue here
const debouncedOnValueChange = useDebounce((newValue: Array<TextNode | InlineNode>) => {
  props.onValueChange(newValue);
  emit('valueChange', newValue);
}, DEBOUNCE_SAVE_DELAY);

const textRef = ref<HTMLElement | null>(null);

const {
  normalizedValue,
  currentLength,
  showPlaceholder,
  getCaretGlobalOffset,
  setCaretPosition,
  lastCaretOffsets,
  handleInput: handleContentEditableInput,
  handleFocus: handleContentEditableFocus,
  handleBlur: handleContentEditableBlur,
  handleKeyDown: handleContentEditableKeyDown,
} = useContentEditable({
  value: props.value,
  isEditable: computed(() => props.isEditable),
  placeholder: props.placeholder,
  characterLimit: props.characterLimit,
  isMultiline: props.isMultiline,
  onValueChange: debouncedOnValueChange,
});

const { applyMarkToSelection, handlePaste: handleRichTextPaste } =
    useRichTextEditor({
      normalizedValue,
      supportedMarks: props.supportedMarks || [],
      getCaretGlobalOffset,
      onValueChange: debouncedOnValueChange,
      lastCaretOffsets,
      characterLimit: props.characterLimit,
    });

const {
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
} = useLinkInteraction({
  textRef,
  isEditable: computed(() => props.isEditable),
  onApplyMark: applyMarkToSelection,
  getCaretGlobalOffset,
  setCaretPosition,
  lastCaretOffsets,
});

const {
  showMentionSearch,
  mentionSearchTerm,
  mentionPosition,
  handleMentionInput,
  handleSelectMentionEntry,
  handleCloseMentionSearch,
  handleMentionKeyDown,
} = useMentionInteraction({
  textRef,
  onValueChange: debouncedOnValueChange,
  normalizedValue,
  getCaretGlobalOffset,
  setCaretPosition,
  lastCaretOffsets,
  editorCallbacks: props.editorCallbacks,
});

const handleInput = () => {
  handleContentEditableInput();
  handleMentionInput();
};

const handleKeyDown = (e: KeyboardEvent) => {
  handleContentEditableKeyDown(e);
  handleMentionKeyDown(e);
};

const handlePaste = (e: ClipboardEvent) => {
  handleRichTextPaste(e);
};

const renderLinkTooltipContent = computed(() => {
  if (isEditingLink.value) {
    return LinkEditModal;
  }
  return LinkTooltip;
});

const renderLinkTooltipContentProps = computed(() => {
  if (isEditingLink.value) {
    return {
      editedUrl: editedUrl.value,
      'onUpdate:editedUrl': (val: string) => editedUrl.value = val,
      editedText: editedText.value,
      'onUpdate:editedText': (val: string) => editedText.value = val,
      onInputConfirm: handleLinkInputConfirm,
      onUnlink: handleUnlink,
      onCancel: handleCancelLinkEdit,
      onSave: handleSaveLink,
    };
  }
  return {
    currentUrl: currentUrl.value,
    isEditable: props.isEditable,
    onCopyLink: handleCopyLink,
    onEditLinkClick: handleEditLinkClick,
  };
});

const commonProps = computed(() => ({
  className: [
    "overflow-wrap max-w-full min-w-0 flex-grow basis-0 cursor-text wrap-anywhere whitespace-pre-wrap outline-none",
    props.className, // Directly include props.className
  ],
  rootTag: props.rootTag,
}));
const showLimitIndicator = computed(() => props.characterLimit !== undefined && props.isEditable);
</script>

<template>
  <LayoutBox
      direction="horizontal"
      gap="md"
      align-items="center"
      :class="props.className"
  >
    <div
        v-if="props.isEditable"
        ref="textRef"
        contentEditable="true"
        :class="[
            ...commonProps.className,
            showPlaceholder ? 'text-rimelight-primary-500' : 'text-rimelight-primary-100',
        ]"
        :data-placeholder="props.placeholder"
        data-editable
        role="textbox"
        tabindex="0"
        :aria-multiline="props.isMultiline ? 'true' : 'false'"
        @input="handleInput"
        @keydown="handleKeyDown"
        @paste="handlePaste" @focus="handleContentEditableFocus"
        @blur="handleContentEditableBlur"
        @mouseover="handleContentEditableMouseOver"
        @mouseleave="handleContentEditableMouseLeave"
    />
    <ReadOnlyText
        v-else
        :value="normalizedValue"
        :class="[
            ...commonProps.className,
            'cursor-default text-rimelight-primary-100',
        ]"
        :is-multiline="props.isMultiline"
        :root-tag="props.rootTag"
    />

    <div
        v-if="showLimitIndicator"
        :class="[
            'ml-auto text-sm font-normal transition-opacity duration-150 ease-in-out group-hover:opacity-100',
            props.characterLimit !== undefined && currentLength >= props.characterLimit
                ? 'text-rimelight-danger-500'
                : 'text-rimelight-primary-500',
            showLimitIndicator ? 'opacity-100' : 'opacity-0',
        ]"
        aria-live="polite"
        aria-atomic="true"
    >
      {{ currentLength }}/{{ props.characterLimit }}
    </div>

    <Tooltip
        v-if="activeLinkElement"
        :is-visible="showLinkTooltip"
        position="right"
        :external-trigger-ref="activeLinkElement"
        @update:is-visible="handleLinkTooltipVisibilityChange"
    >
      <component :is="renderLinkTooltipContent" v-bind="(renderLinkTooltipContentProps as any)" />
    </Tooltip>

    <MentionSearch
        v-if="showMentionSearch && mentionPosition"
        :position="mentionPosition"
        :search-term="mentionSearchTerm"
        @select-entry="handleSelectMentionEntry"
        @close="handleCloseMentionSearch"
    />
  </LayoutBox>
</template>

<style scoped>
</style>