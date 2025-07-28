<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import Label from '~/components/basic/base/Label.vue';
import Button from '~/components/basic/base/Button.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import {useEntryUtils} from '~/composables/Entry/useEntryUtils';
import type {EntryType} from '~/types/Entry';
import {NuxtLink} from '#components';
import LinkEntryModal from "~/components/entry/modals/LinkEntryModal.vue";

interface EntryPropertyProps {
  label: string;
  value: string | undefined;
  isEditable: boolean;
  allowedEntryTypes?: EntryType[];
}

const props = defineProps<EntryPropertyProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', newValue: string | undefined): void;
}>();

const entryUtils = useEntryUtils();

const internalValue = ref<string | undefined>(props.value);
const entryName = ref<string | null>(null);

const isLinkEntryModalOpen = ref(false);

watch(
    () => props.value,
    (newValue) => {
      internalValue.value = newValue;
    },
    { immediate: true }
);

watch(
    internalValue,
    async (newValue) => {
      if (newValue) {
        try {
          entryName.value = await entryUtils.getEntryNameBySlug(newValue);
        } catch (error) {
          console.error('Error fetching entry name:', error);
          entryName.value = null;
        }
      } else {
        entryName.value = null;
      }
    },
    { immediate: true }
);

const handleSelectEntry = (slug: string) => {
  internalValue.value = slug;
  emit('update:modelValue', slug);
};

const handleClearEntry = () => {
  internalValue.value = undefined;
  emit('update:modelValue', undefined);
};

const shouldRender = computed(() => {
  return (internalValue.value && entryName.value) || props.isEditable;
});
</script>

<template>
  <template v-if="shouldRender">
    <dt class="flex flex-row items-center">
      <Label :text="props.label" />
    </dt>
    <dd>
      <template v-if="internalValue && entryName">
        <LayoutBox direction="horizontal" gap="sm" class-name="items-center">
          <NuxtLink
              :to="`/${String(internalValue)}`"
              class="flex-grow truncate text-sm text-rimelight-secondary-500 underline"
          >
            {{ entryName }}
          </NuxtLink>
          <template v-if="props.isEditable">
            <Button
                type="button"
                variant="primary"
                size="xs"
                start-icon="edit"
                title="Change entry"
                @click="isLinkEntryModalOpen = true"
            />
            <Button
                type="button"
                variant="danger"
                size="xs"
                start-icon="delete"
                title="Remove entry"
                @click="handleClearEntry"
            />
          </template>
        </LayoutBox>
      </template>
      <template v-else-if="props.isEditable">
        <LayoutBox direction="horizontal" gap="sm" class-name="items-center">
          <span class="italic text-sm text-rimelight-primary-500">None</span>
          <Button
              type="button"
              variant="primary"
              size="xs"
              start-icon="add"
              title="Select entry"
              class="ml-auto"
              @click="isLinkEntryModalOpen = true"
          />
        </LayoutBox>
      </template>
    </dd>

    <LinkEntryModal
        v-model:is-open="isLinkEntryModalOpen"
        :allowed-entry-types="props.allowedEntryTypes"
        @select-entry="handleSelectEntry"
    />
  </template>
</template>