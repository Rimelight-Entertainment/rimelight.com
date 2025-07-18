<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Label from '~/components/basic/base/Label.vue';
import Button from '~/components/basic/base/Button.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import LinkEntryModal from '~/components/basic/entry/modals/LinkEntryModal.vue';
import { useEntryUtils } from '~/composables/Entry/useEntryUtils';
import type { EntryType } from '~/types/Entry';
import { NuxtLink } from '#components';

interface EntryArrayPropertyProps {
  label: string;
  value: string[] | undefined;
  isEditable: boolean;
  allowedEntryTypes?: EntryType[];
}

interface EntryDisplayItem {
  slug: string;
  name: string | null;
}

const props = defineProps<EntryArrayPropertyProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', newValue: string[] | undefined): void;
}>();

const entryUtils = useEntryUtils();

const internalValues = ref<string[]>([]);
const displayItems = ref<EntryDisplayItem[]>([]);
const isModalOpen = ref(false);

// Watch for changes in the `value` prop and update `internalValues`
watch(
    () => props.value,
    (newValue) => {
      const cleanedValue = Array.isArray(newValue)
          ? newValue.filter((s): s is string => true)
          : [];
      console.log(
          "EntryArrayProperty: Prop 'value' changed. Cleaned value:",
          cleanedValue
      );
      internalValues.value = cleanedValue;
    },
    { immediate: true, deep: true }
);

watch(
    internalValues,
    async (newInternalValues) => {
      console.log(
          "EntryArrayProperty: Fetching names for internalValues:",
          newInternalValues
      );
      if (newInternalValues.length > 0) {
        const items: EntryDisplayItem[] = await Promise.all(
            newInternalValues.map(async (currentSlugFromState) => {
              if (
                  !currentSlugFromState ||
                  currentSlugFromState === '[object Object]'
              ) {
                console.error(
                    'EntryArrayProperty: Invalid slug in internalValues detected during fetchEntryNames:',
                    currentSlugFromState
                );
                return { slug: 'invalid-slug', name: 'ERROR: Invalid Slug' };
              }

              try {
                const name = await entryUtils.getEntryNameBySlug(
                    currentSlugFromState
                );
                console.log(
                    `EntryArrayProperty: Fetched name for slug "${currentSlugFromState}":`,
                    name
                );
                return { slug: currentSlugFromState, name };
              } catch (error) {
                console.error(
                    `Error fetching name for slug ${currentSlugFromState}:`,
                    error
                );
                return { slug: currentSlugFromState, name: 'Error fetching name' };
              }
            })
        );
        console.log('EntryArrayProperty: Setting displayItems:', items);
        displayItems.value = items;
      } else {
        displayItems.value = [];
      }
    },
    { immediate: true, deep: true } // Run immediately, deep watch for array changes
);

const handleAddItem = (newSlug: string) => {
  console.log(
      'EntryArrayProperty: handleAddItem called with newSlug:',
      newSlug,
      'Type:',
      typeof newSlug
  );
  if (!newSlug || newSlug === '' || newSlug === '[object Object]') {
    console.error(
        'EntryArrayProperty: handleAddItem received invalid newSlug:',
        newSlug
    );
    return;
  }
  if (internalValues.value.includes(newSlug)) {
    console.warn(`Entry with slug "${newSlug}" is already in the list.`);
    return;
  }
  const updatedValues = [...internalValues.value, newSlug];
  console.log('EntryArrayProperty: Updating internalValues (add):', updatedValues);
  internalValues.value = updatedValues; // Update ref
  emit('update:modelValue', updatedValues); // Emit to parent
};

const handleRemoveItem = (slugToRemove: string) => {
  console.log(
      'EntryArrayProperty: handleRemoveItem called with slugToRemove:',
      slugToRemove
  );
  const updatedValues = internalValues.value.filter(
      (slug) => slug !== slugToRemove
  );
  console.log('EntryArrayProperty: Updating internalValues (remove):', updatedValues);
  internalValues.value = updatedValues; // Update ref
  emit('update:modelValue', updatedValues); // Emit to parent
};

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

// Computed property to determine if the component should render
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
          title="Add entry"
          class="ml-auto"
          @click="openModal"
      />
    </dt>
    <dd>
      <ul v-if="displayItems.length > 0">
        <li v-for="item in displayItems" :key="item.slug" class="mb-2 last:mb-0">
          <LayoutBox direction="horizontal" gap="sm" class-name="items-center">
            <NuxtLink
                v-if="item.slug && item.slug !== 'invalid-slug'"
                :to="`/${item.slug}`"
                class="flex-grow truncate text-sm text-rimelight-secondary-500 underline"
            >
              {{ item.name || item.slug }}
            </NuxtLink>
            <span v-else class="flex-grow truncate text-sm text-rimelight-primary-500">
              {{ item.name || item.slug }}
            </span>
            <Button
                v-if="props.isEditable"
                type="button"
                variant="danger"
                size="xs"
                start-icon="delete"
                title="Remove entry"
                @click="handleRemoveItem(item.slug)"
            />
          </LayoutBox>
        </li>
      </ul>
      <span v-else-if="props.isEditable" class="italic text-sm text-rimelight-primary-500">
        (No entries, click &#39;+&#39; to add)
      </span>
    </dd>
    <LinkEntryModal
        :is-open="isModalOpen"
        :allowed-entry-types="props.allowedEntryTypes"
        @close="closeModal"
        @select-entry="handleAddItem"
    />
  </template>
</template>