<script setup lang="ts">
import {computed, onUnmounted, ref, watch} from 'vue';
import Modal from '~/components/basic/base/Modal.vue';
import Button from '~/components/basic/base/Button.vue';
import Input from '~/components/basic/base/Input.vue';
import Label from '~/components/basic/base/Label.vue';
import Icon from '~/components/basic/base/Icon.vue';

interface EditorCallbacks {
  showMessage?: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
}

interface ImageUploadModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  existingImageUrl?: string;
  initialFile?: File | null;
  editorCallbacks?: EditorCallbacks;
}

const props = defineProps<ImageUploadModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'upload', file: File, fileName: string): void;
}>();

const fileToUpload = ref<File | null>(null);
const inputFileName = ref('');
const isLoading = ref(false);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const isReplacingImage = computed(() => !!props.existingImageUrl);

// Watch for modal open/initialFile changes to reset state
watch(
    [() => props.isOpen, () => props.initialFile],
    ([newIsOpen, newInitialFile]) => {
      if (newIsOpen) {
        if (newInitialFile) {
          fileToUpload.value = newInitialFile;
          inputFileName.value = newInitialFile.name
              .split('.')[0]
              .replace(/[^a-zA-Z0-9-.]/g, '');
        } else {
          fileToUpload.value = null;
          inputFileName.value = '';
        }
        isLoading.value = false;
        if (fileInputRef.value) {
          fileInputRef.value.value = ''; // Clear file input value
        }
      }
    },
    { immediate: true }
);

// Watch for fileToUpload changes to create/revoke object URLs for preview
watch(
    fileToUpload,
    (newFileToUpload, oldFileToUpload) => {
      // Revoke previous object URL if it exists
      if (oldFileToUpload && previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
      }

      if (newFileToUpload) {
        previewUrl.value = URL.createObjectURL(newFileToUpload);
      } else {
        previewUrl.value = null;
      }
    },
    { immediate: true }
);

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    fileToUpload.value = file;
    inputFileName.value = file.name
        .split('.')[0]
        .replace(/[^a-zA-Z0-9-.]/g, '');
  } else {
    fileToUpload.value = null;
    inputFileName.value = '';
  }
};

const handleFileNameChange = (event: Event) => {
  inputFileName.value = (event.target as HTMLInputElement).value;
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    fileToUpload.value = files[0];
    inputFileName.value = files[0].name
        .split('.')[0]
        .replace(/[^a-zA-Z0-9-.]/g, '');
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

const handleUploadClick = async () => {
  if (!fileToUpload.value) {
    props.editorCallbacks?.showMessage?.(
        'Please select an image file.',
        'error'
    );
    return;
  }

  let finalFileName = inputFileName.value.trim();
  if (!finalFileName) {
    finalFileName = fileToUpload.value.name.replace(/[^a-zA-Z0-9-.]/g, '');
  } else {
    const originalExtension = fileToUpload.value.name.split('.').pop();
    if (originalExtension && !finalFileName.includes('.')) {
      finalFileName = `${finalFileName}.${originalExtension}`;
    }
  }

  if (!finalFileName) {
    props.editorCallbacks?.showMessage?.('File name cannot be empty.', 'error');
    return;
  }

  isLoading.value = true;
  try {
    emit('upload', fileToUpload.value, finalFileName);
    emit('update:isOpen', false);
  } catch (error) {
    props.editorCallbacks?.showMessage?.(
        'Image upload failed. Please try again.',
        'error'
    );
    console.error('Image upload failed in modal:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      :title="isReplacingImage ? 'Replace Image' : 'Upload Image'"
      :description="
      isReplacingImage
        ? 'Choose a new image file to replace the existing one.'
        : 'Select an image file to upload.'
    "
      @update:is-open="emit('update:isOpen', $event)"
      >
    <div
        class="relative flex max-h-[250px] min-h-[150px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-rimelight-primary-500 p-lg text-rimelight-primary-500 hover:bg-rimelight-primary-700 hover:text-white"
        aria-label="Drag and drop or click to select image file"
        role="button"
        tabindex="0"
        @click="fileInputRef?.click()"
        @dragover="handleDragOver"
        @drop="handleDrop"
    >
      <template v-if="!previewUrl">
        <Icon name="addImage" size="xl" />
        <span class="whitespace-normal text-center">
          Drag & Drop or Click to Select File
        </span>
      </template>
      <img
          v-else
          :src="previewUrl"
          alt="Selected image preview"
          class="max-h-full max-w-full object-contain"
      >
      <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
      >
    </div>

    <p v-if="fileToUpload" class="break-all text-center text-sm text-rimelight-primary-200">
      Selected File: {{ fileToUpload.name }}
    </p>

    <template v-if="fileToUpload">
      <Label
          html-for="fileNameInput"
          text="File Name"
          tooltip="Optional: Customize the file name on the server."
      />
      <Input
          id="fileNameInput"
          v-model="inputFileName"
          type="text"
          :placeholder="fileToUpload.name.split('.')[0]"
          size="sm"
          class="w-full"
          @input="handleFileNameChange"
      />
    </template>
      <Button
          type="button"
          :disabled="!fileToUpload || isLoading"
          variant="primary"
          size="sm"
          :text="isReplacingImage ? 'Replace' : 'Upload'"
          :is-loading="isLoading"
          @click="handleUploadClick"
      />
    <template #actions>

    </template>
  </Modal>
</template>