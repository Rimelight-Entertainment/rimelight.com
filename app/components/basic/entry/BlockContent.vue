<script setup lang="ts">
import type { BlockData } from "~/types/blocks";
import LayoutBox from "~/components/basic/base/LayoutBox.vue";
import { useRenderBlocks } from '~/composables/useRenderBlocks';

interface EntryContentProps {
  isEditable: boolean;
  blocksData: BlockData[];
}

const props = defineProps<EntryContentProps>();

const renderedDocumentBlocks = computed(() => {
  return useRenderBlocks(
      props.blocksData,
      props.isEditable,
  );
});
</script>

<template>
  <LayoutBox
      tag="article"
      direction="vertical"
      gap="lg"
  >
    <component :is="block" v-for="(block, index) in renderedDocumentBlocks" :key="index" />
  </LayoutBox>
</template>

<style scoped>

</style>