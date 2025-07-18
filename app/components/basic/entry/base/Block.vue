<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Button from '~/components/basic/base/Button.vue';
import Tooltip from '~/components/basic/base/Tooltip.vue';
import BlockSchema from '~/config/blocks/blockSchema';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import type { BlockData } from '~/types/blocks';

interface BlockProps {
  id: string;
  type: string;
  className?: string;
  isSelected?: boolean;
  draggable?: boolean;
  nestable?: boolean;
  isEditable: boolean;
  isTemplated?: boolean;
}

const props = withDefaults(defineProps<BlockProps>(), {
  isSelected: false,
  draggable: false,
  nestable: false,
  isTemplated: false,
  className: '',
});

const emit = defineEmits<{
  (event: 'duplicate' | 'delete' | 'insertBlockAbove' | 'insertBlockBelow', id: string): void;
  (e: 'dragStart', event: DragEvent, id: string): void;
}>();

const blockRef = ref<HTMLDivElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const dragHandleButtonRef = ref<HTMLButtonElement | null>(null);

const isMenuOpen = ref(false);
const menuPosition = ref<{ x: number; y: number } | null>(null);

const isBlockActuallyDraggable = computed(() => props.draggable && !props.isTemplated);
const isBlockActuallyEditable = computed(() => props.isEditable && !props.isTemplated);
const isDraggableAndEditable = computed(() => props.draggable && props.isEditable);

const baseClasses = 'group flex items-start w-full relative border border-transparent';

const selectedClasses = computed(() =>
    props.isSelected ? 'border-rimelight-primary-400 border' : ''
);

const calculateMenuPosition = async () => {
  if (!dragHandleButtonRef.value) return;

  await nextTick();

  const buttonRect = dragHandleButtonRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const menuHeight = menuRef.value ? menuRef.value.offsetHeight : 0;

  const spacing = 4;

  let newY: number;

  const preferredY = buttonRect.bottom + spacing;

  if (preferredY + menuHeight > viewportHeight && buttonRect.top - menuHeight - spacing >= 0) {
    newY = buttonRect.top - menuHeight - spacing;
  } else {
    newY = preferredY;
  }

  menuPosition.value = {
    x: buttonRect.left,
    y: newY,
  };
};

const handleMenuToggle = (event: MouseEvent) => {
  event.stopPropagation();
  isMenuOpen.value = !isMenuOpen.value;
  if (!isMenuOpen.value) {
    menuPosition.value = null;
  }
};

const handleDuplicateClick = () => {
  emit('duplicate', props.id);
  isMenuOpen.value = false;
};

const handleDeleteClick = () => {
  emit('delete', props.id);
  isMenuOpen.value = false;
};

const handleInsertAboveClick = () => {
  emit('insertBlockAbove', props.id);
  isMenuOpen.value = false;
};

const handleInsertBelowClick = () => {
  emit('insertBlockBelow', props.id);
  isMenuOpen.value = false;
};

// Effect to handle clicks outside the menu to close it
const handleClickOutside = (event: MouseEvent) => {
  if (
      isMenuOpen.value &&
      menuRef.value &&
      !menuRef.value.contains(event.target as Node) &&
      dragHandleButtonRef.value &&
      !dragHandleButtonRef.value.contains(event.target as Node)
  ) {
    isMenuOpen.value = false;
    menuPosition.value = null;
  }
};

const handleScrollOrResize = () => {
  if (isMenuOpen.value) {
    calculateMenuPosition();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('scroll', handleScrollOrResize);
  window.addEventListener('resize', handleScrollOrResize);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('scroll', handleScrollOrResize);
  window.removeEventListener('resize', handleScrollOrResize);
});

watch(isMenuOpen, async (newValue) => {
  if (newValue) {
    await nextTick();
    await calculateMenuPosition();
  }
});

const blockSchemaEntry = computed(() => BlockSchema[props.type as BlockData['type']]);
</script>

<template>
  <LayoutBox direction="vertical" gap="lg">
    <div
        :id="props.id"
        ref="blockRef"
        :data-block-type="props.type"
        :data-draggable="isBlockActuallyDraggable"
        :data-nestable="props.nestable"
        :draggable="false"
        :class="[
        baseClasses,
        props.isEditable
          ? props.isTemplated
            ? 'hover:border hover:border-rimelight-warning-600'
            : ''
          : '',
        props.isEditable ? 'gap-md p-lg hover:bg-rimelight-primary-900' : '',
        selectedClasses,
        props.className || '',
      ]"
        @dragend="(event) => {
        (event.currentTarget as HTMLElement).classList.remove('dragging');
      }"
    >
      <Tooltip
          v-if="isDraggableAndEditable"
      >
        <template #content>
          <div class="flex flex-col text-left">
            <span class="font-bold">{{ blockSchemaEntry.displayName }}</span>
            <span class="text-sm">{{ blockSchemaEntry.tooltip }}</span>
          </div>
        </template>
        <span class="z-10 flex-shrink-0 opacity-0 group-hover:opacity-100">
          <Button
              ref="dragHandleButtonRef"
              variant="ghost"
              size="sm"
              :draggable="isBlockActuallyDraggable"
              aria-haspopup="true"
              :aria-expanded="isMenuOpen"
              :aria-controls="`block-menu-${props.id}`"
              :aria-label="`Block type: ${props.type}`"
              start-icon="dragHandle"
              :icon-props="{ className: 'fill-rimelight-primary-100' }"
              @dragstart="(e) => {
                console.log(`Block ${props.id}: Drag Start from handle`);
                e.stopPropagation();
                e.dataTransfer!.setData('text/plain', props.id);
                blockRef?.classList.add('dragging');
                emit('dragStart', e as DragEvent, props.id);
                e.dataTransfer!.effectAllowed = 'move';
                isMenuOpen = false;
              }"
              @click="handleMenuToggle"
          />
        </span>
      </Tooltip>

      <Teleport to="body">
        <div
            v-if="isMenuOpen"
            :id="`block-menu-${props.id}`"
            ref="menuRef"
            class="fixed z-50 flex max-w-[192px] flex-col gap-sm border border-rimelight-primary-500 bg-rimelight-primary-900 p-md text-sm whitespace-nowrap shadow-lg"
            :style="{ top: menuPosition?.y + 'px', left: menuPosition?.x + 'px' }"
            role="menu"
        >
          <Button
              variant="ghost"
              size="xs"
              role="menuitem"
              text="Insert Block Above"
              @click="handleInsertAboveClick"
          />
          <Button
              variant="ghost"
              size="xs"
              role="menuitem"
              text="Insert Block Below"
              @click="handleInsertBelowClick"
          />
          <hr v-if="isBlockActuallyEditable" >
          <Button
              v-if="isBlockActuallyEditable"
              variant="ghost"
              size="xs"
              role="menuitem"
              text="Duplicate"
              @click="handleDuplicateClick"
          />
          <Button
              v-if="isBlockActuallyEditable"
              variant="ghost"
              size="xs"
              role="menuitem"
              text="Delete"
              @click="handleDeleteClick"
          />
        </div>
      </Teleport>

      <div
          :class="`w-full overflow-hidden ${isDraggableAndEditable ? '' : ''}`"
      >
        <LayoutBox
            v-if="props.isEditable && $slots.blockActions"
            direction="horizontal"
            gap="sm"
        >
          <slot name="blockActions"/>
        </LayoutBox>
        <slot/>
      </div>
    </div>
  </LayoutBox>
</template>