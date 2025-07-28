<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import Icon from '~/components/basic/base/Icon.vue';
import Modal from '~/components/basic/base/Modal.vue';
import { EntryCategory } from '~/types/Entry';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import Button from '~/components/basic/base/Button.vue';
import { useHotkeys } from '~/composables/useHotkeys';
import { useDebounce } from '~/composables/useDebounce';

interface EditCategoriesModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  selectedCategories: EntryCategory[];
}

const props = defineProps<EditCategoriesModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'updateCategories', categories: EntryCategory[]): void;
}>();

const workingSelectedCategories = ref<EntryCategory[]>([]);
const searchTerm = ref('');
const focusedIndex = ref(-1);

const listboxRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Define allAvailableCategories within the modal
const allAvailableCategories: EntryCategory[] = Object.values(EntryCategory).filter(
    () => true
) as EntryCategory[];

// Watch the prop and initialize workingSelectedCategories
watch(() => props.selectedCategories, (newVal) => {
  workingSelectedCategories.value = [...newVal];
}, { immediate: true });

// Filter available categories based on search term and exclude already assigned categories
const filteredAndUnassignedCategories = computed<EntryCategory[]>(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  return allAvailableCategories.filter(
      (category) =>
          !workingSelectedCategories.value.includes(category) &&
          category.toLowerCase().includes(lowerCaseSearchTerm)
  );
});

const handleAddCategory = (category: EntryCategory) => {
  if (!workingSelectedCategories.value.includes(category)) {
    workingSelectedCategories.value.push(category);
    searchTerm.value = '';
    focusedIndex.value = -1;
  }
};

const handleRemoveCategory = (categoryToRemove: EntryCategory) => {
  workingSelectedCategories.value = workingSelectedCategories.value.filter(
      (cat) => cat !== categoryToRemove,
  );
};

const handleConfirm = () => {
  emit('updateCategories', workingSelectedCategories.value);
  emit('update:isOpen', false);
};

const handleCancel = () => {
  emit('update:isOpen', false);
};

const handleSearchTermChange = useDebounce((newSearchTerm: string) => {
  searchTerm.value = newSearchTerm;
  focusedIndex.value = 0;
}, 300);

watch(focusedIndex, (newIndex) => {
  if (listboxRef.value && newIndex >= 0) {
    const selectedElement = listboxRef.value.children[newIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.focus();
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }
});

const { registerHotkey, unregisterHotkey } = useHotkeys();

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => inputRef.value?.focus(), 0);

    registerHotkey('editCategoriesModal_escape', {
      keys: ['Escape'],
      handler: () => handleCancel(),
      prevent: true,
      context: 'editCategoriesModal',
    });
    registerHotkey('editCategoriesModal_arrowDown', {
      keys: ['ArrowDown'],
      handler: (event) => {
        event.preventDefault();
        if (filteredAndUnassignedCategories.value.length > 0) {
          focusedIndex.value = (focusedIndex.value + 1) % filteredAndUnassignedCategories.value.length;
        }
      },
      prevent: true,
      context: 'editCategoriesModal',
    });
    registerHotkey('editCategoriesModal_arrowUp', {
      keys: ['ArrowUp'],
      handler: (event) => {
        event.preventDefault();
        if (filteredAndUnassignedCategories.value.length > 0) {
          focusedIndex.value = (focusedIndex.value - 1 + filteredAndUnassignedCategories.value.length) % filteredAndUnassignedCategories.value.length;
        }
      },
      prevent: true,
      context: 'editCategoriesModal',
    });
    registerHotkey('editCategoriesModal_enter', {
      keys: ['Enter'],
      handler: (event) => {
        event.preventDefault();
        if (focusedIndex.value !== -1 && filteredAndUnassignedCategories.value[focusedIndex.value]) {
          handleAddCategory(filteredAndUnassignedCategories.value[focusedIndex.value]);
        }
      },
      prevent: true,
      context: 'editCategoriesModal',
    });
  } else {
    // Unregister hotkeys when modal closes
    unregisterHotkey('editCategoriesModal_escape');
    unregisterHotkey('editCategoriesModal_arrowDown');
    unregisterHotkey('editCategoriesModal_arrowUp');
    unregisterHotkey('editCategoriesModal_enter');
    searchTerm.value = ''; // Clear search term on close
    focusedIndex.value = -1; // Reset focused index on close
  }
}, { immediate: true });

// Ensure hotkeys are unregistered when the component unmounts, regardless of modal state
onUnmounted(() => {
  unregisterHotkey('editCategoriesModal_escape');
  unregisterHotkey('editCategoriesModal_arrowDown');
  unregisterHotkey('editCategoriesModal_arrowUp');
  unregisterHotkey('editCategoriesModal_enter');
});
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Manage Categories"
      description="Add or remove categories from the entry."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <LayoutBox direction="vertical" gap="md" padding="md">
        <LayoutBox direction="vertical" gap="sm">
          <h3 class="text-lg font-bold text-rimelight-primary-100">Assigned Categories</h3>
          <div v-if="workingSelectedCategories.length > 0" class="flex flex-wrap gap-2">
          <span
              v-for="category in workingSelectedCategories"
              :key="category"
              class="group relative inline-flex items-center rounded-md bg-rimelight-primary-900 px-4 py-2 text-sm text-rimelight-primary-100"
          >
            {{ category }}
            <button
                type="button"
                class="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-rimelight-primary-800 text-rimelight-primary-400 opacity-0 transition-opacity duration-200 hover:bg-rimelight-danger-600 hover:text-rimelight-primary-50 group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove category"
                @click="handleRemoveCategory(category)"
            >
              <Icon name="x" size="xs" />
            </button>
          </span>
          </div>
          <div v-else class="text-sm text-rimelight-primary-500">
            No categories assigned yet.
          </div>
        </LayoutBox>

        <LayoutBox direction="vertical" gap="sm">
          <h3 class="text-lg font-bold text-rimelight-primary-100">Add New Categories</h3>
          <LayoutBox direction="horizontal" align-items="center" gap="sm" class="rounded bg-rimelight-primary-700 p-2">
            <Icon name="search" size="sm" class="text-rimelight-primary-500" />
            <input
                ref="inputRef"
                type="text"
                :value="searchTerm"
                placeholder="Search available categories..."
                class="w-full bg-transparent text-sm text-rimelight-primary-100 placeholder-rimelight-primary-500 outline-none"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="category-menu-listbox"
                aria-expanded="true"
                @input="handleSearchTermChange(($event.target as HTMLInputElement).value)"
            >
          </LayoutBox>
          <div id="category-menu-listbox" ref="listboxRef" role="listbox" tabindex="-1" class="flex-1 overflow-y-auto max-h-48">
            <div
                v-if="filteredAndUnassignedCategories.length === 0"
                class="p-md text-sm text-rimelight-primary-500"
            >
              No categories found or all available categories are already assigned.
            </div>
            <div
                v-for="(category, index) in filteredAndUnassignedCategories"
                :key="category"
                role="option"
                :aria-selected="index === focusedIndex"
                :class="[
                'cursor-pointer px-md py-sm text-sm',
                index === focusedIndex
                  ? 'bg-rimelight-primary-600 text-rimelight-primary-50'
                  : 'text-rimelight-primary-100 hover:bg-rimelight-primary-700',
              ]"
                @click="handleAddCategory(category)"
            >
              {{ category }}
            </div>
          </div>
        </LayoutBox>
      </LayoutBox>
    </template>
    <template #actions>
      <Button variant="primary" text="Confirm" @click="handleConfirm" />
    </template>
  </Modal>
</template>