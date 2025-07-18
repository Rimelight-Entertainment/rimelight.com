<script setup lang="ts">
import { NuxtLink } from '#components';
import Icon from '~/components/basic/base/Icon.vue';
import type { IconName } from '~/types/Icons';

interface MegaMenuItemProps {
  href: string;
  iconName: IconName;
  title: string;
  description: string;
  className?: string;
}

const props = defineProps<MegaMenuItemProps>();
</script>

<template>
  <NuxtLink
      :to="props.href"
      :class="[
        'flex p-md gap-md hover:bg-rimelight-neutral-100 transition group no-underline',
        props.className,
      ]"
  >
    <div class="h-6 w-6 flex shrink-0 justify-center items-center">
      <Icon
          :name="props.iconName"
          class="h-full w-full object-contain"
      />
    </div>

    <div>
      <h6 class="text-sm text-rimelight-primary-400">{{ props.title }}</h6>
      <p class="text-rimelight-neutral-300 text-xs leading-tight">{{ props.description }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>

</style>