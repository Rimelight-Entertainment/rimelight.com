<script setup lang="ts">
import Label from '~/components/basic/base/Label.vue';
import Input from '~/components/basic/base/Input.vue';

interface NumberPropertyProps {
  label: string;
  value: number | undefined;
  isEditable: boolean;
}

const props = defineProps<NumberPropertyProps>();

// Define the emitting for v-model support
const emit = defineEmits<{
  (e: 'update:modelValue', newValue: number | undefined): void;
}>();

const handleChange = (event: Event) => {
  const stringValue = (event.target as HTMLInputElement).value;
  const numericValue = stringValue === '' ? undefined : Number(stringValue);
  emit('update:modelValue', numericValue);
};
</script>

<template>
  <dt class="w-24">
    <Label :text="props.label" />
  </dt>
  <dd class="w-full">
    <Input
        type="number"
        :value="props.value ?? ''"
        :disabled="!props.isEditable"
        placeholder="Enter number..."
        @input="handleChange"
    />
  </dd>
</template>