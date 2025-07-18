<script setup lang="ts">
import { ref, computed, h } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import type { ImageBlockData } from "~/types/blocks";
import Button from "~/components/basic/base/Button.vue";
import LayoutBox from "~/components/basic/base/LayoutBox.vue";
import Image from "~/components/basic/base/Image.vue";
import Icon from "~/components/basic/base/Icon.vue";
import ImageUploadModal from "~/components/basic/entry/modals/UploadImageModal.vue";
import Block from "~/components/basic/entry/base/Block.vue";
import { uploadImageToServer, deleteImageFromServer } from "~/server/utils/api/image-block-api";

const props = defineProps({
  block: {
    type: Object as PropType<GenericBlockComponentProps<ImageBlockData>["block"]>,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<GenericBlockComponentProps<ImageBlockData>["editorCallbacks"]>,
    default: () => ({}),
  },
  draggable: {
    type: Boolean,
    default: false,
  },
  nestable: {
    type: Boolean,
    default: false,
  },
  isTemplated: {
    type: Boolean,
    default: false,
  },
});

const isPromptOpen = ref(false);
const droppedFile = ref<File | null>(null);

const hasImage = computed(
    () => props.block.attrs?.url && props.block.attrs.url !== "",
);

const handleOpenPrompt = () => {
  if (props.isEditable) {
    isPromptOpen.value = true;
  }
};

const handleClosePrompt = () => {
  isPromptOpen.value = false;
  droppedFile.value = null;
};

const handleBlockDragOver = (event: DragEvent) => {
  if (props.isEditable) {
    event.preventDefault(); // Required to allow drop
  }
};

const handleBlockDrop = (event: DragEvent) => {
  if (props.isEditable) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      droppedFile.value = files[0];
      handleOpenPrompt();
    }
  }
};

const handleUploadImage = async (
    fileToUpload: File,
    finalFileName: string,
) => {
  props.editorCallbacks?.showMessage?.("Uploading image...", "info");

  const oldFileName = props.block.attrs?.fileName;

  try {
    const result = await uploadImageToServer(fileToUpload, finalFileName);

    if (result) {
      props.editorCallbacks?.updateBlock?.(props.block.id, {
        attrs: { url: result.url, fileName: result.fileName },
      });
      props.editorCallbacks?.showMessage?.("Image uploaded successfully!", "success");
      // No need to call handleClosePrompt() here, as the modal will emit 'close' itself
      // after a successful upload
      // handleClosePrompt();
      if (oldFileName) {
        console.log(
            `Attempting to delete old image during replacement: ${oldFileName}`,
        );
        deleteImageFromServer(oldFileName)
            .then((success) => {
              if (!success) {
                console.error(
                    `Failed to delete old image ${oldFileName} during replacement.`,
                );
              } else {
                console.log(`Successfully deleted old image: ${oldFileName}`);
              }
            })
            .catch((err) => {
              console.error(
                  `Error during background deletion of old image ${oldFileName}:`,
                  err,
              );
            });
      }
    } else {
      props.editorCallbacks?.showMessage?.(
          "Image upload failed. Please try again.",
          "error",
      );
      throw new Error("Upload failed"); // Propagate error for modal to handle
    }
  } catch (error) {
    props.editorCallbacks?.showMessage?.(
        "An unexpected error occurred during upload.",
        "error",
    );
    console.error("Upload error:", error);
    throw error; // Re-throw to ensure modal can catch it
  }
};

const handleClearImage = async () => {
  if (!props.block.attrs?.fileName) {
    props.editorCallbacks?.showMessage?.("No image to clear.", "warning");
    return;
  }

  props.editorCallbacks?.showMessage?.("Clearing image...", "info");

  const success = await deleteImageFromServer(props.block.attrs.fileName);

  if (success) {
    props.editorCallbacks?.updateBlock?.(props.block.id, {
      attrs: { url: "", fileName: "" },
    });
    props.editorCallbacks?.showMessage?.("Image cleared successfully!", "success");
  } else {
    props.editorCallbacks?.updateBlock?.(props.block.id, {
      attrs: { url: "", fileName: "" },
    });
    props.editorCallbacks?.showMessage?.(
        "Failed to delete image from server, but image cleared from block.",
        "warning",
    );
    console.error(
        `Failed to delete image ${props.block.attrs.fileName} from server. Block image cleared locally.`,
    );
  }
};

// Define block-specific actions to be passed to the Block component
const imageBlockActions = computed(() => {
  if (!props.isEditable || !hasImage.value) {
    return null;
  }

  return h(LayoutBox, { direction: "horizontal", gap: "xs" }, () => [
    h(Button, {
      onClick: handleOpenPrompt,
      variant: "ghost",
      size: "sm",
      startIcon: "blocks.media.image",
      title: "Replace Image",
    }),
    h(Button, {
      onClick: handleClearImage,
      variant: "ghost",
      size: "sm",
      startIcon: "delete",
      title: "Clear Image",
    }),
  ]);
});
</script>

<template>
  <Block
      :id="block.id"
      :type="block.type"
      :is-editable="isEditable"
      :draggable="draggable"
      :nestable="nestable"
      :is-templated="isTemplated"
      :block-actions="imageBlockActions"
      @drag-start="editorCallbacks?.onDragStart"
      @duplicate="editorCallbacks?.duplicateBlock"
      @delete="editorCallbacks?.deleteBlock"
      @insert-block-above="editorCallbacks?.onInsertBlockAbove"
      @insert-block-below="editorCallbacks?.onInsertBlockBelow"
  >
    <div
        :class="['group relative', { 'has-edit-controls': isEditable }]"
        @dragover.prevent="handleBlockDragOver"
        @drop.prevent="handleBlockDrop"
    >
      <template v-if="!hasImage">
        <div
            v-if="isEditable"
            :class="[
            'relative flex min-h-[100px] w-full cursor-pointer items-center justify-center border border-dashed p-4 text-rimelight-primary-500',
            'border-rimelight-primary-500 hover:bg-rimelight-primary-700 hover:text-white',
          ]"
            aria-label="Add Image"
            role="button"
            tabindex="0"
            @click="handleOpenPrompt"
            @dragover.prevent="handleBlockDragOver"
            @drop.prevent="handleBlockDrop"
        >
          <span class="text-center">Click or Drag Image to Upload</span>
        </div>
        <div
            v-else
            class="relative flex min-h-[100px] w-full items-center justify-center border border-dashed border-rimelight-danger-500 bg-rimelight-danger-800 p-4 text-rimelight-danger-500"
        >
          <span class="text-center">Image Not Found</span>
        </div>
      </template>
      <template v-else>
        <Image
            :src="block.attrs.url"
            :alt="block.attrs.altText || block.attrs.fileName || 'Uploaded image'"
            container-class-name="mx-auto block w-full h-auto"
            image-class-name="object-contain w-full h-full"
            :width="1200"
            :height="800"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        >
          <template #error>
            <div
                class="flex flex-col items-center justify-center p-4 text-gray-500"
            >
              <Icon name="status.error" size="lg" />
              <span>Image Load Error</span>
            </div>
          </template>
        </Image>
      </template>
    </div>

    <ImageUploadModal
        :is-open="isPromptOpen"
        :existing-image-url="block.attrs?.url || ''"
        :initial-file="droppedFile"
        :editor-callbacks="editorCallbacks"
        @close="handleClosePrompt"
        @upload="handleUploadImage"
    />
  </Block>
</template>