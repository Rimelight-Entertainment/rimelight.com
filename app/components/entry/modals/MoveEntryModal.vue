<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import Button from '~/components/basic/base/Button.vue';
import Modal from '~/components/basic/base/Modal.vue';
import Label from '~/components/basic/base/Label.vue';
import Input from '~/components/basic/base/Input.vue';
import { useEntryUtils } from '~/composables/Entry/useEntryUtils';

interface MoveEntryModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  currentSlug: string;
  currentEntryId: string;
}

const props = defineProps<MoveEntryModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();

const router = useRouter();

const entryUtils = useEntryUtils();

const newSlugPath = ref('');
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);

const originalFilename = computed(() => {
  if (!props.currentSlug) return '';
  const parts = props.currentSlug.split('/');
  return parts[parts.length - 1];
});

// Watch for changes in the isOpen prop or currentSlug to initialize the newSlugPath
watch(
    [() => props.isOpen, () => props.currentSlug],
    ([newIsOpen, newCurrentSlug]) => {
      if (newIsOpen && newCurrentSlug) {
        const lastSlashIndex = newCurrentSlug.lastIndexOf('/');
        // Extract the path part of the slug (excluding the filename)
        newSlugPath.value = lastSlashIndex > -1 ? newCurrentSlug.substring(0, lastSlashIndex) : '';
        errorMessage.value = null; // Clear any previous errors on open
      }
    },
    { immediate: true } // Run the watcher immediately when the component is mounted
);

const handleSlugPathChange = (event: Event) => {
  newSlugPath.value = (event.target as HTMLInputElement).value;
  errorMessage.value = null; // Clear error when user types
};

const handleMoveEntry = async () => {
  errorMessage.value = null;
  isLoading.value = true;

  // Normalize the new slug path: trim whitespace and remove leading/trailing slashes
  const normalizedNewSlugPath = newSlugPath.value.trim().replace(/^\/|\/$/g, '');
  // Construct the full target slug
  const targetFullSlug = normalizedNewSlugPath
      ? `${normalizedNewSlugPath}/${originalFilename.value}`
      : originalFilename.value; // If no new path, it's just the filename (moving to root)

  if (!normalizedNewSlugPath && originalFilename.value === '') {
    errorMessage.value = 'Cannot move a entry without a filename to the root.';
    isLoading.value = false;
    return;
  }

  if (targetFullSlug === props.currentSlug) {
    errorMessage.value = 'New path must be different from the current path.';
    isLoading.value = false;
    return;
  }

  try {
    const exists = await entryUtils.doesEntryExist(targetFullSlug);
    if (exists) {
      errorMessage.value = `A entry with slug "${targetFullSlug}" already exists. Please choose a different path.`;
      isLoading.value = false;
      return;
    }

    // Call the entry utility to move the entry
    await entryUtils.moveEntry(
        props.currentEntryId,
        originalFilename.value,
        normalizedNewSlugPath
    );

    emit('update:isOpen', false);
    await router.replace(`/${targetFullSlug}?mode=editor`);
    console.log(`Entry moved and navigated to: /${targetFullSlug}`);
  } catch (error) {
    console.error('Failed to move entry:', error);
    if (error instanceof Error) {
      errorMessage.value = `Failed to move entry: ${error.message}`;
    } else {
      errorMessage.value = 'Failed to move entry due to an unknown error.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Move Entry"
      description="Choose a new path for the entry."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <Label
          html-for="current-entry-slug"
          text="Current Slug"
          tooltip="The current slug for the entry."
          :required="false"
      />
      <span class="text-md text-rimelight-primary-100">{{props.currentSlug}}</span>
      <Input
          id="new-entry-path"
          v-model="newSlugPath"
          type="text"
          placeholder="games/new-folder"
          :required=true
          label="New Path"
          label-tooltip="The new path for the entry. Leave empty for root."
          @input="handleSlugPathChange"
      />
      <p v-if="errorMessage" class="mt-sm text-sm text-rimelight-danger-500">
        {{ errorMessage }}
      </p>
    </template>
    <template #actions>
      <Button
          variant="primary"
          size="sm"
          text="Move Entry"
          :is-loading="isLoading"
          @click="handleMoveEntry"
      />
    </template>
  </Modal>
</template>

<style scoped>
</style>