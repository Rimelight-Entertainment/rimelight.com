<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {EntrySearchData, EntrySearchResults, EntryType } from '~/types/Entry';
import { useEntryUtils } from '~/composables/Entry/useEntryUtils';
import { useDebounce } from '~/composables/useDebounce';

import Modal from '~/components/basic/base/Modal.vue';
import Input from '~/components/basic/base/Input.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';

interface LinkEntryModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  allowedEntryTypes?: EntryType[];
}

const props = defineProps<LinkEntryModalProps>();

// Define emits for the component
const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'select-entry', slug: string): void;
}>();

const entryUtils = useEntryUtils();

const searchTerm = ref('');
// Use useDebounce composable for searchTerm
const debouncedSearchTerm = useDebounce(searchTerm, 300);

const searchResults = ref<EntrySearchResults | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Watch the debouncedSearchTerm instead of searchTerm directly
watch(debouncedSearchTerm, async (newDebouncedTerm) => {
  if (!newDebouncedTerm.trim()) {
    searchResults.value = null;
    error.value = null;
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    searchResults.value = await entryUtils.searchEntries(newDebouncedTerm);
  } catch (err) {
    console.error('Error searching entries:', err);
    error.value = 'Failed to search entries. Please try again.';
    searchResults.value = null;
  } finally {
    isLoading.value = false;
  }
}, { immediate: true });

watch(
    () => props.isOpen,
    (newIsOpen) => {
      if (newIsOpen) {
        searchTerm.value = '';
        searchResults.value = null;
        isLoading.value = false;
        error.value = null;
      }
    }
);

const handleSelect = (slug: string) => {
  emit('select-entry', slug); // Emit 'select-entry' event
  emit('update:isOpen', false);
  searchTerm.value = '';
  searchResults.value = null;
};

const uniqueFilteredResults = computed<EntrySearchData[]>(() => {
  if (!searchResults.value) return [];

  const combinedResults = [
    ...(searchResults.value.matchingTitles || []),
    ...(searchResults.value.matchingCategories || []),
    ...(searchResults.value.matchingTags || []),
  ];

  // Filter by allowedEntryTypes if provided
  const filteredByType = props.allowedEntryTypes
      ? combinedResults.filter(
          (entry) => props.allowedEntryTypes?.includes(entry.type)
      )
      : combinedResults;

  // Ensure uniqueness by ID and sort by title
  return Array.from(
      new Map<string, EntrySearchData>(
          filteredByType.map((entry) => [entry.id, entry])
      ).values()
  ).sort((a, b) => a.title.localeCompare(b.title));
});
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Search Entry"
      description="Select the entry to be linked."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <LayoutBox direction="vertical" gap="md">
        <Input
            v-model="searchTerm"
            type="text"
            placeholder="Search entry by name or slug..."
            class="w-full"
        />
        <div class="mt-md h-60 w-full overflow-y-auto">
          <p v-if="isLoading" class="text-rimelight-primary-400">Searching...</p>
          <p v-else-if="error" class="text-rimelight-error-500">{{ error }}</p>
          <p
              v-else-if="
            !searchResults ||
            (searchResults.matchingTitles.length === 0 &&
              searchResults.matchingCategories.length === 0 &&
              searchResults.matchingTags.length === 0)
          "
              class="text-rimelight-primary-400"
          >
            {{
              searchTerm.trim()
                  ? 'No results found.'
                  : 'Start typing to search for entries.'
            }}
          </p>
          <p
              v-else-if="uniqueFilteredResults.length === 0"
              class="text-rimelight-primary-400"
          >
            No entries found matching your search and selected filters.
          </p>
          <ul v-else class="document-editor-scrollbar max-h-60 overflow-y-auto">
            <li
                v-for="entry in uniqueFilteredResults"
                :key="entry.id"
                class="mb-2 cursor-pointer rounded p-2 hover:bg-rimelight-primary-700"
            >
              <button
                  type="button"
                  class="w-full text-left text-rimelight-primary-100"
                  @click="handleSelect(entry.slug)"
              >
                <strong class="text-rimelight-accent-blue">
                  {{ entry.title }}
                </strong>
                <span class="block text-sm text-rimelight-primary-400">
                /{{ entry.slug === '' ? 'index' : entry.slug }} ({{ entry.type }})
              </span>
              </button>
            </li>
          </ul>
        </div>
      </LayoutBox>
    </template>
    <template #actions>

    </template>
  </Modal>
</template>