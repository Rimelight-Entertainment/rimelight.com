<template>
  <Block
      :id="block.id"
      :type="block.type"
      :is-editable="isEditable"
      :draggable="draggable"
      :nestable="nestable"
      :is-templated="isTemplated"
      @drag-start="editorCallbacks?.onDragStart"
      @duplicate="editorCallbacks?.duplicateBlock"
      @delete="editorCallbacks?.deleteBlock"
      @insert-block-above="editorCallbacks?.onInsertBlockAbove"
      @insert-block-below="editorCallbacks?.onInsertBlockBelow"
  >
    <EditableText
        :value="initialContent"
        :is-editable="isEditable"
        placeholder="Type '/' for commands"
        :is-multiline="true"
        class="w-full text-sm"
        :supported-marks="['bold', 'italic', 'underline', 'link', 'mention']"
        :editor-callbacks="editorCallbacks"
        :on-value-change="handleTextChange"
        @update:value="handleTextChange"
    />
  </Block>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import EditableText from "~/components/entry/base/EditableText.vue";
import type { ParagraphBlockData, TextNode, InlineNode } from "~/types/blocks";
import Block from "~/components/entry/base/Block.vue";

const props = defineProps({
  block: {
    type: Object as PropType<
        GenericBlockComponentProps<ParagraphBlockData>["block"]
    >,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<ParagraphBlockData>["editorCallbacks"]
    >,
    default: () => ({}),
  },
  draggable: {
    type: Boolean,
    default: true,
  },
  nestable: {
    type: Boolean,
    default: true,
  },
  isTemplated: {
    type: Boolean,
    default: false,
  },
});

const initialContent = computed<Array<TextNode | InlineNode>>(() => {
  return (props.block.attrs?.text || [{ type: "text", text: "" }]) as Array<
      TextNode | InlineNode
  >;
});

const handleTextChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(props.block.id, {
    attrs: {
      ...props.block.attrs,
      text: newContent,
    },
  });
};
</script>