// components/entry/modals/BrowseEntriesModal.vue
<script setup lang="ts">
import { ref, watch, provide, onMounted } from 'vue';
import BrowseEntriesNode from '~/components/entry/modals/BrowseEntriesNode.vue';
import Modal from '~/components/basic/base/Modal.vue';
import type { FolderNode, EntryNode } from '~/types/Entry';
import { useEntryUtils } from '~/composables/Entry/useEntryUtils';

interface EntryExplorerMenuProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
}

// Update defineProps to remove entryStructure
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'navigate', slug: string): void;
}>();

const router = useRouter();

const expandedFolders = ref<Set<string>>(new Set());
const menuContentRef = ref<HTMLDivElement | null>(null);
const entryStructure = ref<(EntryNode | FolderNode)[]>([]);
const isLoadingStructure = ref(true);
const structureError = ref<string | null>(null);

const { fetchEntryStructure } = useEntryUtils();

const loadEntryStructure = async () => {
  isLoadingStructure.value = true;
  structureError.value = null;
  try {
    entryStructure.value = await fetchEntryStructure();
  } catch (error: any) {
    console.error("Failed to load entry structure:", error);
    structureError.value = error.message || "Could not load entry structure.";
  } finally {
    isLoadingStructure.value = false;
  }
};

onMounted(() => {
  loadEntryStructure();
});

watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) {
        if (menuContentRef.value) {
          menuContentRef.value.focus();
        }
        if (entryStructure.value.length === 0 && !isLoadingStructure.value) {
          loadEntryStructure();
        }
      }
    },
    { immediate: true },
);

const toggleFolder = (folderPath: string) => {
  const newSet = new Set(expandedFolders.value);
  if (newSet.has(folderPath)) {
    newSet.delete(folderPath);
  } else {
    newSet.add(folderPath);
  }
  expandedFolders.value = newSet;
};

provide('onNavigate', (slug: string) => {
  emit('update:isOpen', false);
  router.push(`/${slug}`);
  console.log(`Navigating to: /${slug}`);
});
provide('onToggleFolder', toggleFolder);
provide('expandedFolders', expandedFolders);
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Browse Entries"
      description="Select an entry to navigate to."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <div
          ref="menuContentRef"
          class="document-editor-scrollbar border border-rimelight-primary-500 flex-1 overflow-y-auto outline-none"
          tabindex="-1"
      >
      <span v-if="isLoadingStructure" class="text-sm text-rimelight-primary-100">
        Loading entry structure...
      </span>
        <span v-else-if="structureError" class="text-sm text-red-500">
        {{ structureError }}
      </span>
        <span v-else-if="entryStructure.length === 0" class="text-sm text-rimelight-primary-100">
        No entries found.
      </span>
        <template v-else>
          <BrowseEntriesNode
              v-for="node in entryStructure"
              :key="node.type === 'entry' ? node.slug : node.path"
              :node="node"
              :depth="0"
          />
        </template>
      </div>
    </template>
  </Modal>
</template>

<style scoped>

</style>