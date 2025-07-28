<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Label from '~/components/basic/base/Label.vue';
import Button from '~/components/basic/base/Button.vue';
import Input from '~/components/basic/base/Input.vue';

interface LinkTooltipProps {
  editedUrl: string;
  editedText: string;
}

const props = defineProps<LinkTooltipProps>();

const emit = defineEmits<{
  'update:editedUrl': [url: string];
  'update:editedText': [text: string];
  'inputConfirm': [e: KeyboardEvent];
  'unlink': [];
  'cancel': [];
  'save': [];
}>();

const urlInputRef = ref<HTMLInputElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  urlInputRef.value?.focus();
});

// Handlers for emitting events
const handleUrlChange = (event: Event) => {
  emit('update:editedUrl', (event.target as HTMLInputElement).value);
};

const handleTextChange = (event: Event) => {
  emit('update:editedText', (event.target as HTMLInputElement).value);
};

const handleInputConfirm = (event: KeyboardEvent) => {
  emit('inputConfirm', event);
};

const handleUnlink = () => {
  emit('unlink');
};

const handleCancel = () => {
  emit('cancel');
};

const handleSave = () => {
  emit('save');
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
          @keydown="handleInputConfirm"
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
          @keydown="handleInputConfirm"
      />
    </div>
    <div class="flex items-center justify-between">
      <Button variant="danger" size="xs" text="Unlink" @click="handleUnlink" />
      <div class="flex gap-sm">
        <Button
            variant="danger"
            size="xs"
            text="Cancel"
            @click="handleCancel"
        />
        <Button variant="primary" size="xs" text="Save" @click="handleSave" />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>