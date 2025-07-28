<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from '~/components/basic/base/Button.vue';
import Modal from '~/components/basic/base/Modal.vue';
import Label from '~/components/basic/base/Label.vue';
import Input from '~/components/basic/base/Input.vue';
import EditableSelect from '~/components/entry/base/EditableSelect.vue';

import { useEntryUtils, HttpError } from '~/composables/Entry/useEntryUtils';
import { EntryType } from '~/types/Entry';

interface NewEntryModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
}

const props = defineProps<NewEntryModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();

const router = useRouter();

const entryUtils = useEntryUtils();

const slug = ref('');
const title = ref('');
const selectedEntryType = ref<EntryType>(EntryType.DEFAULT);
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);

const modalDialogRef = ref<HTMLDivElement | null>(null);

const entryTypeOptions = computed<readonly EntryType[]>(() =>
    Object.values(EntryType)
);

const editableSelectPortalTarget = computed(() => modalDialogRef.value);

watch(
    () => props.isOpen,
    (newIsOpen) => {
      if (newIsOpen) {
        slug.value = '';
        title.value = '';
        selectedEntryType.value = EntryType.DEFAULT;
        errorMessage.value = null;
        isLoading.value = false;
      }
    }
);

const handleSlugChange = (event: Event) => {
  const inputValue = (event.target as HTMLInputElement).value;
  const lowerCaseInput = inputValue.toLowerCase();
  let tempSlug = '';

  const allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789/-';

  for (let i = 0; i < lowerCaseInput.length; i++) {
    const char = lowerCaseInput[i];
    if (allowedChars.includes(char)) {
      tempSlug += char;
    }
  }

  slug.value = tempSlug;
  errorMessage.value = null;
};

const handleTitleChange = (event: Event) => {
  title.value = (event.target as HTMLInputElement).value;
  errorMessage.value = null;
};

const handleEntryTypeChange = (newValue: EntryType) => {
  selectedEntryType.value = newValue;
  errorMessage.value = null;
};

const handleCreateEntry = async () => {
  let finalSlug = slug.value.trim();

  // Normalize slug: replace multiple slashes with single, remove leading/trailing slashes
  finalSlug = finalSlug.replace(/\/+/g, '/');
  finalSlug = finalSlug.replace(/^\/|\/$/g, '');

  if (!finalSlug) {
    errorMessage.value = 'Entry slug cannot be empty.';
    return;
  }

  if (finalSlug === '/' || finalSlug === '') {
    errorMessage.value =
        "Invalid slug format. Slug cannot be just '/' or empty after trimming.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const exists = await entryUtils.doesEntryExist(finalSlug);
    if (exists) {
      errorMessage.value = `A entry with slug "${finalSlug}" already exists.`;
      isLoading.value = false;
      return;
    }

    await entryUtils.saveNewEntry(
        finalSlug,
        title.value.trim() === '' ? undefined : title.value.trim(),
        selectedEntryType.value
    );

    emit('update:isOpen', false);
    await router.push(`/${finalSlug}?mode=editor`);
    console.log(`New entry created and navigated to: /${finalSlug}`);
  } catch (error) {
    console.error('Failed to create new entry:', error);
    if (error instanceof HttpError) {
      errorMessage.value = `Failed to create entry: ${error.message} (Status: ${error.status})`;
    } else if (error instanceof Error) {
      errorMessage.value = `Failed to create entry: ${error.message}`;
    } else {
      errorMessage.value = 'An unknown error occurred during entry creation.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Create New Entry"
      description="Creates a new entry at the target slug."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <Input
          v-model="slug"
          type="text"
          size="sm"
          label="Entry Slug"
          label-tooltip="The slug for the new entry."
          :required="true"
          placeholder="franchises/grand-tale"
          @input="handleSlugChange"
      />
      <Input
          v-model="title"
          type="text"
          size="sm"
          label="Entry Title"
          label-tooltip="The title for the new entry."
          :required="false"
          placeholder="New Entry"
          @input="handleTitleChange"
      />
      <p v-if="errorMessage" class="text-sm text-rimelight-danger-500">
        {{ errorMessage }}
      </p>
      <Label
          html-for="entry-template"
          text="Template"
          tooltip="The entry template to use for the new entry."
          :required="true"
      />
      <EditableSelect
          block-id="new-entry-template-select"
          :value="selectedEntryType" :options="entryTypeOptions" :is-editable="true"
          placeholder="Select a template"
          :portal-target="editableSelectPortalTarget"
          @update:model-value="handleEntryTypeChange"
      />
    </template>
    <template #actions>
      <Button
          variant="primary"
          size="sm"
          :is-loading="isLoading"
          text="Create Entry"
          @click="handleCreateEntry"
      />
    </template>
  </Modal>
</template>

<style scoped>

</style>