<script lang="ts" setup>
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import Button from "~/components/basic/base/Button.vue";

interface Modal {
  /**
   * Controls the visibility of the modal.
   */
  isOpen: boolean;
  /**
   * The title of the modal, displayed at the top.
   */
  title: string;
  /**
   * The description of the modal, displayed below the title.
   */
  description: string;
  /**
   * CSS classes applied to the dialog element itself, not its backdrop.
   */
  dialogClassName?: string;
  /**
   * If true, clicking on the backdrop (outside the modal content) will not close the modal.
   * Defaults to false (backdrop click closes the modal).
   */
  disableBackdropClick?: boolean;
  /**
   * CSS classes applied to the modal content box itself. These will be passed to LayoutBox.
   */
  contentClassName?: string;
  /**
   * An ID for the modal dialog itself, for accessibility purposes (e.g., used by aria-labelledby).
   */
  id?: string;
  /**
   * Defines the minimum width of the modal content.
   * Uses Tailwind CSS width classes (e.g., 'min-w-md', 'min-w-xl').
   */
  minWidth?: string;
  /**
   * Defines the maximum width of the modal content.
   * Uses Tailwind CSS width classes (e.g., 'max-w-md', 'max-w-xl').
   */
  maxWidth?: string;
}

const props = withDefaults(defineProps<Modal>(), {
  dialogClassName: undefined,
  disableBackdropClick: false,
  contentClassName: undefined,
  id: undefined,
  minWidth: 'min-w-96',
  maxWidth: 'max-w-96',
});

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();

const internalDialogRef = ref<HTMLDialogElement | null>(null);

const generatedTitleId = useId();
const generatedDescriptionId = useId();

const handleCloseEvent = () => {
  emit('update:isOpen', false);
};

const handleCancelEvent = (event: Event) => {
  event.preventDefault();
  emit('update:isOpen', false);
};

const handleBackdropClick = (event: MouseEvent) => {
  const dialogElement = internalDialogRef.value;
  if (
      dialogElement &&
      event.target === dialogElement &&
      !props.disableBackdropClick
  ) {
    handleCloseEvent();
  }
};

// Watch for changes in `isOpen` to open/close the native <dialog> element
watch(
    () => props.isOpen,
    async (newValue) => {
      const dialogElement = internalDialogRef.value;
      if (!dialogElement) {
        await nextTick();
        if (!internalDialogRef.value) {
          return;
        }
      }

      const currentDialogElement = internalDialogRef.value;

      if (currentDialogElement) {
        if (newValue) {
          // Always call showModal() when isOpen becomes true
          currentDialogElement.showModal();
        } else {
          // Only call close() if the dialog is currently open
          if (currentDialogElement.open) {
            currentDialogElement.close();
          }
        }
      }
    },
    { immediate: true },
);

onMounted(() => {
  const dialogElement = internalDialogRef.value;
  if (dialogElement) {
    dialogElement.addEventListener('close', handleCloseEvent);
    dialogElement.addEventListener('cancel', handleCancelEvent);
  }
});

onBeforeUnmount(() => {
  const dialogElement = internalDialogRef.value;
  if (dialogElement) {
    dialogElement.removeEventListener('close', handleCloseEvent);
    dialogElement.removeEventListener('cancel', handleCancelEvent);
  }
});

function useId() {
  return `modal-${Math.random().toString(36).substring(2, 9)}`;
}
</script>

<template>
  <ClientOnly>
    <teleport to="body">
      <dialog
          :id="props.id"
          ref="internalDialogRef"
          :class="`border-none bg-transparent p-0 ${props.dialogClassName || ''}`"
          :aria-labelledby="generatedTitleId"
          :aria-describedby="generatedDescriptionId"
          @click="handleBackdropClick"
          @cancel.prevent="handleCancelEvent"
      >
        <LayoutBox
            position="fixed"
            direction="vertical"
            padding="lg"
            gap="lg"
            :class="[
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'min-h-24 max-h-128 border border-rimelight-primary-500 bg-rimelight-primary-900 shadow-lg',
              props.maxWidth,
              props.minWidth,
              props.contentClassName || ''
            ]"
        >
          <LayoutBox direction="vertical" gap="sm">
            <span
                :id="generatedTitleId"
                class="text-xl font-bold text-rimelight-primary-100"
            >
              {{ props.title }}
            </span>
            <span
                :id="generatedDescriptionId"
                class="text-md text-rimelight-primary-100"
            >
              {{ props.description }}
            </span>
          </LayoutBox>
          <slot name="content" />
          <hr >
          <LayoutBox direction="horizontal" gap="md" justify-content="between">
            <Button
                variant="danger"
                size="sm"
                text="Cancel"
                @click="emit('update:isOpen', false)"
            />
            <slot name="actions"/>
          </LayoutBox>
        </LayoutBox>
      </dialog>
    </teleport>
  </ClientOnly>
</template>

<style scoped>

</style>