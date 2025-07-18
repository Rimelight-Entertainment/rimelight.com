<script setup lang="ts">
import Label from '~/components/basic/base/Label.vue';
import EditableSelect from '~/components/basic/entry/base/EditableSelect.vue';

interface EnumPropertyProps {
  label: string;
  value: string | undefined;
  options: string[];
  isEditable: boolean;
  blockId: string;
}

const props = defineProps<EnumPropertyProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', newValue: string | undefined): void;
}>();

const handleSelectChange = (newValue: string) => {
  const finalValue = newValue === '' ? undefined : newValue;
  emit('update:modelValue', finalValue);
};
</script>

<template>
  <dt class="w-24">
    <Label :text="props.label" tooltip="" />
  </dt>
  <dd class="w-full">
    <EditableSelect
        :value="props.value || ''"
        :options="(props.options as readonly string[])"
        :is-editable="props.isEditable"
        :placeholder="`Select ${props.label}`"
        alignment="start"
        class="w-full text-sm"
        :block-id="props.blockId"
        @update:model-value="handleSelectChange"
    />
  </dd>
</template>