<script setup lang="ts">
import {computed, h, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {useEntryUtils} from '~/composables/Entry/useEntryUtils';
import type {SearchResults} from '~/types/Entry';

interface MentionSearchInputProps {
  searchTerm: string;
  position: { top: number; left: number };
}

interface EntryTitleData {
  id: string;
  slug: string;
  title: string;
}

const props = defineProps<MentionSearchInputProps>();

const emit = defineEmits<{
  (e: 'select-entry', id: string, slug: string, title: string): void;
  (e: 'close'): void;
}>();

const entryUtils = useEntryUtils();

const searchResults = ref<SearchResults | null>(null);
const debouncedSearchTerm = ref(props.searchTerm);
const selectedIndex = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);
const listItemRefs = ref(new Map<string, HTMLLIElement | null>());

let removeClickListener: (() => void) | null = null;
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
        containerRef.value &&
        !containerRef.value.contains(event.target as Node)
    ) {
      emit('close');
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  removeClickListener = () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
});

onUnmounted(() => {
  if (removeClickListener) {
    removeClickListener();
  }
});

watch(
    () => props.searchTerm,
    (newSearchTerm) => {
      const handler = setTimeout(() => {
        debouncedSearchTerm.value = newSearchTerm;
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    },
    { immediate: true }
);

watch(
    debouncedSearchTerm,
    async (newDebouncedSearchTerm) => {
      if (newDebouncedSearchTerm) {
        try {
          searchResults.value = await entryUtils.searchEntries(newDebouncedSearchTerm);
          selectedIndex.value = 0;
        } catch (error) {
          console.error('Failed to search entries for mentions:', error);
          searchResults.value = null;
        }
      } else {
        searchResults.value = null; // Corrected from `setSearchResults(null)`
      }
    },
    { immediate: true }
);

const navigableEntries = computed<EntryTitleData[]>(() => {
  if (!searchResults.value) return [];

  const combined = [
    ...(searchResults.value.matchingTitles || []),
    ...(searchResults.value.matchingTags || []),
    ...(searchResults.value.matchingCategories || []),
  ];

  return Array.from(
      new Map(combined.map((entry) => [entry.id, entry])).values()
  ).sort((a, b) => a.title.localeCompare(b.title));
});

watch(
    [selectedIndex, navigableEntries],
    async () => {
      if (navigableEntries.value.length > 0) {
        await nextTick();
        const selectedEntryId = navigableEntries.value[selectedIndex.value]?.id;
        const selectedItem = selectedEntryId
            ? listItemRefs.value.get(selectedEntryId)
            : null;

        if (selectedItem) {
          selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    },
    { flush: 'post' }
);

const handleSelect = (entry: EntryTitleData) => {
  emit('select-entry', entry.id, entry.slug, entry.title);
  emit('close');
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (navigableEntries.value.length === 0) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value =
          (selectedIndex.value + 1) % navigableEntries.value.length;
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value =
          (selectedIndex.value - 1 + navigableEntries.value.length) %
          navigableEntries.value.length;
      break;
    case 'Enter':
      event.preventDefault();
      if (navigableEntries.value[selectedIndex.value]) {
        handleSelect(navigableEntries.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      event.preventDefault();
      emit('close');
      break;
    default:
      break;
  }
};

const isItemSelected = computed(() => (entryId: string) => {
  return navigableEntries.value[selectedIndex.value]?.id === entryId;
});

const renderCategory = (
    heading: string,
    entries: EntryTitleData[] | undefined,
    categoryKey: string
) => {
  if (!entries || entries.length === 0) return null;

  return h('div', { key: categoryKey }, [
    h(
        'h3',
        {
          class:
              'py-xs mt-sm border-b border-rimelight-primary-700 px-sm text-sm font-semibold text-rimelight-primary-300 first:mt-0',
        },
        heading
    ),
    h(
        'ul',
        { class: 'm-0 list-none p-0' },
        entries.map((entry) =>
            h(
                'li',
                {
                  key: `${categoryKey}-${entry.id}`,
                  ref: (el) => {
                    listItemRefs.value.set(entry.id, el as HTMLLIElement);
                  },
                  class: `py-xs cursor-pointer px-sm hover:bg-rimelight-primary-700 ${
                      isItemSelected.value(entry.id) ? 'bg-rimelight-primary-600' : ''
                  }`,
                  onClick: () => handleSelect(entry),
                  tabindex: 0,
                  role: 'option',
                  'aria-selected': isItemSelected.value(entry.id),
                },
                entry.title
            )
        )
    ),
  ]);
};
</script>

<template>
  <Teleport to="body">
    <div
        ref="containerRef"
        class="absolute z-50 overflow-hidden rounded border border-rimelight-primary-600 bg-rimelight-primary-800 shadow-lg"
        :style="{
        top: `${props.position.top}px`,
        left: `${props.position.left}px`,
        maxHeight: '300px',
        overflowY: 'auto',
      }"
        @keydown="handleKeyDown"
    >
      <div
          v-if="debouncedSearchTerm === '' && !searchResults"
          class="py-xs px-sm text-rimelight-primary-300"
      >
        Type to search for entries...
      </div>

      <div
          v-else-if="debouncedSearchTerm !== '' && navigableEntries.length === 0"
          class="py-xs px-sm text-rimelight-primary-300"
      >
        No entries found.
      </div>

      <template v-else-if="navigableEntries.length > 0">
        <div
            class="p-xs border-b border-rimelight-primary-600 text-sm text-rimelight-primary-300"
        >
          Searching for:
          <span class="font-semibold text-rimelight-neutral-50">
            {{ debouncedSearchTerm }}
          </span>
        </div>

        <component
            :is="
            renderCategory(
              'Entries with matching title:',
              searchResults?.matchingTitles,
              'titles'
            )
          "
        />
        <component
            :is="
            renderCategory(
              'Entries with matching categories:',
              searchResults?.matchingCategories,
              'categories'
            )
          "
        />
        <component
            :is="
            renderCategory(
              'Entries with matching tags:',
              searchResults?.matchingTags,
              'tags'
            )
          "
        />
      </template>
    </div>
  </Teleport>
</template>