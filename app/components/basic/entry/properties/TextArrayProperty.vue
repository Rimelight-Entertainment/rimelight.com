<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Label from '~/components/basic/base/Label.vue';
import EditableText from '~/components/basic/entry/base/EditableText.vue';
import type { TextNode, InlineNode } from '~/types/blocks';
import Button from '~/components/basic/base/Button.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';

interface TextArrayPropertyProps {
  label: string;
  value: Array<string | Array<TextNode | InlineNode>> | undefined;
  isEditable: boolean;
}

const props = defineProps<TextArrayPropertyProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', newValue: Array<string | Array<TextNode | InlineNode>>): void;
}>();

const internalValues = ref<Array<string | Array<TextNode | InlineNode>>>(
    props.value || []
);

watch(
    () => props.value,
    (newValue) => {
      internalValues.value = newValue || [];
    },
    { deep: true, immediate: true }
);

const handleItemChange = (newValue: Array<TextNode | InlineNode>, index: number) => {
  const updatedValues = [...internalValues.value];
  updatedValues[index] = newValue;
  internalValues.value = updatedValues;
  emit('update:modelValue', updatedValues);
};

const handleAddItem = () => {
  const emptyItem: string = '';
  const updatedValues = [...internalValues.value, emptyItem];
  internalValues.value = updatedValues;
  emit('update:modelValue', updatedValues);
};

const handleRemoveItem = (index: number) => {
  const updatedValues = internalValues.value.filter((_, i) => i !== index);
  internalValues.value = updatedValues;
  emit('update:modelValue', updatedValues);
};

const shouldRender = computed(() => {
  return (internalValues.value && internalValues.value.length > 0) || props.isEditable;
});
</script>

<template>
  <template v-if="shouldRender">
    <dt class="flex flex-row items-center">
      <Label :text="props.label" />
      <Button
          v-if="props.isEditable"
          type="button"
          variant="primary"
          size="xs"
          start-icon="add"
          title="Add item"
          class="ml-auto"
          @click="handleAddItem"
      />
    </dt>
    <dd>
      <ul v-if="internalValues.length > 0">
        <li v-for="(item, index) in internalValues" :key="index">
          <LayoutBox direction="horizontal" gap="sm">
            <EditableText
                :value="item"
                :is-editable="props.isEditable"
                :character-limit="256"
                :supported-marks="[]"
                class="w-full text-sm"
                root-tag="span"
                :on-value-change="(newValue) => handleItemChange(newValue, index)"
                @update:model-value="(newValue) => handleItemChange(newValue, index)"
            />
            <Button
                v-if="props.isEditable"
                type="button"
                variant="danger"
                size="xs"
                start-icon="delete"
                title="Remove item"
                @click="handleRemoveItem(index)"
            />
          </LayoutBox>
        </li>
      </ul>
      <span v-else-if="props.isEditable" class="italic text-sm text-rimelight-primary-500">
        (No items, click &#39;+&#39; to add)
      </span>
    </dd>
  </template>
</template>