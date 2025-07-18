<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Input from '~/components/basic/base/Input.vue';
import Label from '~/components/basic/base/Label.vue';
import Button from '~/components/basic/base/Button.vue';

interface LinkEditModalProps {
  editedUrl: string;
  editedText: string;
  onInputConfirm: (e: KeyboardEvent) => void;
  onUnlink: () => void;
  onCancel: () => void;
  onSave: () => void;
}

const props = defineProps<LinkEditModalProps>();

const emit = defineEmits<{
  (e: 'update:editedUrl' | 'update:editedText', value: string): void;
  (e: 'inputConfirm', event: KeyboardEvent): void;
  (e: 'unlink' | 'cancel' | 'save'): void;
}>();

const urlInputRef = ref<HTMLInputElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null);

// Focus on the URL input when the component is mounted
onMounted(() => {
  urlInputRef.value?.focus();
});

// Helper functions to emit updates for v-model compatibility
const handleUrlChange = (event: Event) => {
  emit('update:editedUrl', (event.target as HTMLInputElement).value);
};

const handleTextChange = (event: Event) => {
  emit('update:editedText', (event.target as HTMLInputElement).value);
};

const handleKeyDown = (e: KeyboardEvent) => {
  emit('inputConfirm', e);
};
</script>

<template>
  <div class="flex w-64 flex-col gap-md p-md">
    <div class="flex flex-col gap-sm">
      <Label
          html-for="url-input"
          text="URL"
          tooltip="The link's web address."
          :required="true"
      />
      <Input
          id="url-input"
          ref="urlInputRef"
          type="text"
          :value="props.editedUrl"
          placeholder="https://"
          @input="handleUrlChange"
          @keydown="handleKeyDown"
      />
    </div>
    <div class="flex flex-col gap-sm">
      <Label
          html-for="text-input"
          text="Text"
          tooltip="The text that is displayed in place of the URL."
          :required="true"
      />
      <Input
          id="text-input"
          ref="textInputRef"
          type="text"
          :value="props.editedText"
          placeholder="Link Text"
          @input="handleTextChange"
          @keydown="handleKeyDown"
      />
    </div>
    <div class="flex items-center justify-between">
      <Button variant="danger" size="xs" text="Unlink" @click="emit('unlink')" />
      <div class="flex gap-sm">
        <Button variant="danger" size="xs" text="Cancel" @click="emit('cancel')" />
        <Button variant="primary" size="xs" text="Save" @click="emit('save')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>