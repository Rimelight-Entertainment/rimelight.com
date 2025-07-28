<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '~/components/basic/base/Modal.vue';
import Button from '~/components/basic/base/Button.vue';
import { EntryType } from '~/types/Entry';
import { entryTemplates } from '~/data/templates/entryTemplates';
import EditableSelect from '~/components/entry/base/EditableSelect.vue';
import { useEntryUtils, HttpError } from '~/composables/Entry/useEntryUtils';
interface ConvertEntryModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  currentEntryId: string;
  currentSlug: string;
  currentEntryType: EntryType;
}

const props = defineProps<ConvertEntryModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'convert', targetEntryType: EntryType): void;
}>();

const router = useRouter();

const { convertEntryTemplate, getEntry } = useEntryUtils();
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const selectedEntryType = ref<EntryType | null>(null);

const selectBlockId = 'convert-entry-select-id';

const modalDialogRef = ref<HTMLDialogElement | null>(null);

const availableEntryTypeOptions = computed(() => {
  return Object.values(EntryType)
      .filter((type) => type !== EntryType.DEFAULT)
      .map((type) => ({
        value: type,
        label: entryTemplates[type]?.defaultTitle || type,
      }));
});

const handleConvertClick = async () => {
  if (!selectedEntryType.value) {
    errorMessage.value = 'Please select a entry type to convert to.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  if (props.currentEntryType !== EntryType.DEFAULT) {
    errorMessage.value = 'Only entries of type DEFAULT can be converted.';
    isLoading.value = false;
    return;
  }

  try {
    // Perform the conversion
    await convertEntryTemplate(props.currentEntryId, selectedEntryType.value);

    // Re-fetch the updated entry data after conversion
    const updatedEntry = await getEntry(props.currentSlug);

    if (updatedEntry) {
      console.log(
          `Entry successfully converted to ${selectedEntryType.value} and data re-fetched.`,
      );
    } else {
      errorMessage.value =
          "Entry conversion successful, but failed to re-fetch updated entry data.";
      console.warn("Could not re-fetch entry data after conversion.");
    }


    emit('update:isOpen', false);
    console.log(`Entry converted to ${selectedEntryType.value}. Forcing entry reload.`);
    router.go(0);
  } catch (err) {
    console.error("Failed to convert or re-fetch entry:", err);
    if (err instanceof HttpError) {
      errorMessage.value = `Failed to convert entry: ${err.message} (Status: ${err.status})`;
    } else if (err instanceof Error) {
      errorMessage.value = `Failed to convert entry: ${err.message}`;
    } else {
      errorMessage.value = "An unknown error occurred during entry conversion.";
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSelectChange = (newValue: string) => {
  selectedEntryType.value = newValue as EntryType;
};
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Convert Entry"
      description="Select a entry template to convert to."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <EditableSelect
          :value="selectedEntryType || ''"
          :options="availableEntryTypeOptions.map((option) => option.value)"
          :is-editable="true"
          placeholder="Select Entry Type to Convert"
          alignment="start"
          class="w-full text-sm"
          :block-id="selectBlockId"
          :portal-target="modalDialogRef"
          @update:value="handleSelectChange"
      />
    </template>
    <template #actions>
      <Button
          variant="primary"
          size="sm"
          text="Convert"
          :disabled="!selectedEntryType"
          @click="handleConvertClick"
      />
    </template>
  </Modal>
</template>

<style scoped>
</style>