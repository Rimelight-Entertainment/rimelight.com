<script setup lang="ts">
import { computed } from 'vue';
import type { InlineNode, TextNode } from '~/types/blocks';
import { contentToHtml } from '~/utils/contentUtils';

interface ReadOnlyTextProps {
  value: string | Array<TextNode | InlineNode>;
  className?: string;
  isMultiline?: boolean;
  rootTag?: keyof HTMLElementTagNameMap;
}

const props = withDefaults(defineProps<ReadOnlyTextProps>(), {
  isMultiline: false,
  rootTag: 'p', // Default to 'p'
  className: '',
});

const stringToTextNodeArray = (text: string): TextNode[] => {
  return [{ type: 'text', text: text || '' }];
};

const normalizedValue = computed(() => {
  if (typeof props.value === 'string') {
    return stringToTextNodeArray(props.value);
  }
  return props.value;
});

const displayHtml = computed(() => {
  return contentToHtml(normalizedValue.value);
});

</script>

<template>
  <component
      :is="props.rootTag"
      :class="`overflow-wrap max-w-full min-w-0 flex-grow basis-0 cursor-default wrap-anywhere whitespace-pre-wrap text-rimelight-primary-100 outline-none ${props.className || ''}`"
      :data-editable="false"
      role="textbox"
      tabindex="-1"
      :aria-multiline="props.isMultiline ? 'true' : 'false'"
      v-html="displayHtml"
  />
</template>