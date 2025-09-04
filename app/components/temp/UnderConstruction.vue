<script setup lang="ts">
import { ref } from 'vue';

const password = ref('');
const isError = ref(false);
const runtimeConfig = useRuntimeConfig();

const isUnlocked = useState('siteUnlocked', () => false);

function checkPassword() {
  if (password.value === runtimeConfig.public.sitePassword) {
    isUnlocked.value = true;
    isError.value = false;
  } else {
    isError.value = true;
    password.value = '';
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="flex flex-col items-center gap-2">
        <UIcon name="material-symbols:construction" class="text-6xl text-primary" />
        <h1 class="text-2xl font-bold">Under Construction</h1>
      </div>
    </template>
    <div class="flex flex-col items-center gap-4">
      <p class="text-center text-muted">
        This website is currently in under construction. Please enter the password to view.
      </p>
      <UFormField label="Password" :error="isError ? 'Incorrect password' : false" class="w-full">
        <UInput
          v-model="password"
          type="password"
          placeholder="Enter password"
          class="w-full"
          @keyup.enter="checkPassword"
        />
      </UFormField>
      <UButton
        block
        color="primary"
        label="Unlock Site"
        @click="checkPassword"
      />
    </div>
  </UCard>
</template>