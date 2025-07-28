<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { CategoryOrder } from '~/config/blocks/blockSchema';
import Icon from '~/components/basic/base/Icon.vue';
import Modal from '~/components/basic/base/Modal.vue';
import type { FlatBlockInfo, GroupedBlocks } from '~/types/blocks';
import LayoutBox from "~/components/basic/base/LayoutBox.vue";
import Input from "~/components/basic/base/Input.vue";

interface PlaceBlockModalProps {
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  groupedBlocks: GroupedBlocks;
  flatBlocks: FlatBlockInfo[];
  focusedIndex: number;
  searchTerm: string;
}

const props = defineProps<PlaceBlockModalProps>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'select' | 'update:searchTerm', payload: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const scrollableRef = ref<HTMLDivElement | null>(null);
const rootMenuRef = ref<HTMLDivElement | null>(null);

const hasScrollbar = ref(false);

watch([() => props.focusedIndex, () => props.flatBlocks.length], () => {
  let container: HTMLElement | null = null;

  if (scrollableRef.value) {
    container = scrollableRef.value;
  } else if (rootMenuRef.value) {
    container = rootMenuRef.value;
  }

  if (container && props.focusedIndex >= 0 && props.focusedIndex < props.flatBlocks.length) {
    const focusedElement = container.querySelector(
        `[data-flat-index="${props.focusedIndex}"]`,
    ) as HTMLElement;

    if (focusedElement) {
      focusedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }
}, { flush: 'post' });

onMounted(() => {
  requestAnimationFrame(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
});

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const checkScrollbar = () => {
    if (scrollableRef.value) {
      hasScrollbar.value = scrollableRef.value.scrollHeight > scrollableRef.value.clientHeight;
    }
  };

  checkScrollbar();

  resizeObserver = new ResizeObserver(checkScrollbar);

  if (scrollableRef.value) {
    resizeObserver.observe(scrollableRef.value);
  }
});

onUnmounted(() => {
  if (scrollableRef.value && resizeObserver) {
    resizeObserver.unobserve(scrollableRef.value);
    resizeObserver = null;
  }
});

const sortedCategories = computed(() => {
  return Object.keys(props.groupedBlocks).sort((a, b) => {
    const aIndex = CategoryOrder.indexOf(a);
    const bIndex = CategoryOrder.indexOf(b);

    if (aIndex > -1 && bIndex > -1) {
      return aIndex - bIndex;
    }
    if (aIndex > -1) {
      return -1;
    }
    if (bIndex > -1) {
      return 1;
    }
    return a.localeCompare(b);
  });
});

const hasBlocksToDisplay = computed(() => props.flatBlocks.length > 0);

defineExpose({
  rootMenuRef,
});
</script>

<template>
  <Modal
      :is-open="props.isOpen"
      title="Add Block"
      description="Select the block type to add."
      @update:is-open="emit('update:isOpen', $event)"
  >
    <template #content>
      <Input
          ref="inputRef"
          type="search"
          placeholder="Search blocks..."
          :value="props.searchTerm"
          @input="emit('update:searchTerm', ($event.target as HTMLInputElement).value)"
          @keydown="($event: KeyboardEvent) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes($event.key)) {
              $event.preventDefault();
            }
          }"
      />
      <LayoutBox
          ref="scrollableRef"
          direction="vertical"
          padding="md"
          gap="sm"
          role="listbox"
          aria-label="Block Suggestions"
          tabindex="0"
          class="document-editor-scrollbar overflow-y-auto border border-rimelight-primary-500"
      >
          <template v-if="hasBlocksToDisplay">
            <LayoutBox
                v-for="category in sortedCategories"
                :key="category"
                role="group"
                direction="vertical"
                gap="sm"
                :aria-label="`${category} blocks`"
            >
              <template v-if="props.groupedBlocks[category] && props.groupedBlocks[category].length > 0">
                <h5 class="text-sm font-semibold text-rimelight-primary-100">
                  {{ category }}
                </h5>
                <ul class="flex list-none flex-col gap-sm">
                  <li
                      v-for="block in props.groupedBlocks[category]"
                      :key="block.type"
                      :data-flat-index="props.flatBlocks.findIndex((b) => b.type === block.type)"
                      :class="`
                    flex cursor-pointer items-center gap-md border border-rimelight-primary-500 bg-rimelight-primary-600 p-md
                    ${props.flatBlocks.findIndex((b) => b.type === block.type) === props.focusedIndex ? 'bg-rimelight-primary-700' : 'hover:bg-rimelight-primary-700'}
                  `"
                      :aria-selected="props.flatBlocks.findIndex((b) => b.type === block.type) === props.focusedIndex"
                      tabindex="-1" @click="emit('select', block.type)"
                  >
                    <Icon
                        :name="block.icon"
                        size="sm"
                        class="text-rimelight-primary-100"
                    />
                    <div>
                      <h6 class="text-sm text-rimelight-primary-100">
                        {{ block.displayName }}
                      </h6>
                      <span class="text-xs text-rimelight-primary-100">
                        {{ block.tooltip }}
                      </span>
                    </div>
                  </li>
                </ul>
              </template>
            </LayoutBox>
          </template>
          <span v-else class="p-sm text-center text-sm text-rimelight-primary-100">
            No results found.
          </span>
      </LayoutBox>
    </template>
    <template #actions/>/
  </Modal>
</template>

<style scoped>

</style>