<script lang="ts" setup>
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import { NuxtLink } from '#components';
import Icon from '~/components/basic/base/Icon.vue';
import type { EntryData } from '~/types/Entry';
import { useBreadcrumbs } from '~/composables/Entry/useBreadcrumbs';


//TODO Is the last (current page) a link? if it is it shouldnt be, also it should be highlighted

interface BreadcrumbProps {
  entryData: EntryData;
}

const props = defineProps<BreadcrumbProps>();

const breadcrumbs = useBreadcrumbs(props.entryData);
</script>

<template>
  <LayoutBox
      tag="nav"
      direction="horizontal"
      gap="sm"
      align-items="center"
      aria-label="Breadcrumbs"
  >
    <template v-for="(item, index) in breadcrumbs" :key="item.href">
      <NuxtLink
          :to="item.href"
          class="hover:underline text-rimelight-primary-300 hover:text-rimelight-primary-100 text-sm font-medium"
      >
        {{ item.name }}
      </NuxtLink>
      <Icon v-if="index < breadcrumbs.length - 1" class="text-rimelight-primary-500" name="arrowRight" size="md"/>
    </template>
  </LayoutBox>
</template>