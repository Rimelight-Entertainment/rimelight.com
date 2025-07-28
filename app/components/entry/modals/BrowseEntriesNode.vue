<script setup lang="ts">
import { computed, inject } from 'vue';
import type { Ref } from 'vue';
import type { EntryNode, FolderNode } from '~/types/Entry';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import Button from '~/components/basic/base/Button.vue';

interface NodeProps {
  node: EntryNode | FolderNode;
  depth: number;
}

const props = defineProps<NodeProps>();

const onToggleFolder = inject<(folderPath: string) => void>('onToggleFolder')!;
const expandedFolders = inject<Ref<Set<string>>>('expandedFolders')!;

const isNodeExpanded = computed(() =>
    props.node.type === 'folder' ? expandedFolders.value.has(props.node.path) : false,
);

const indentationStyle = computed(() => ({
  'padding-left': `${props.depth * 8}px`,
}));

const handleFolderClick = () => {
  if (props.node.type === 'folder') {
    onToggleFolder(props.node.path);
  }
};
</script>

<template>
  <LayoutBox direction="vertical" :style="indentationStyle">
    <template v-if="node.type === 'entry'">
      <Button
          variant="ghost"
          size="sm"
          align-items="start"
          start-icon="entry"
          :text="node.name"
          :href="`/${node.slug}`"
      />
    </template>
    <template v-else>
      <Button
          variant="ghost"
          size="sm"
          align-items="start"
          :start-icon="isNodeExpanded ? 'folderOpen' : 'folderClosed'"
          :text="node.name"
          @click="handleFolderClick"
      />
    </template>
    <LayoutBox
        v-if="node.type === 'folder' && isNodeExpanded && node.children.length > 0"
        direction="vertical"
    >
      <BrowseEntriesNode
          v-for="childNode in node.children"
          :key="childNode.type === 'folder' ? `folder-${childNode.path}` : `entry-${childNode.slug}`"
          :node="childNode"
          :depth="depth + 1"
      />
    </LayoutBox>
  </LayoutBox>
</template>

<style scoped></style>