<script setup lang="ts">
import type {PropType} from "vue";
import {computed, h, ref, watch} from "vue";
import type {GenericBlockComponentProps} from "~/config/blocks/blockSchema";
import BlockSlot from "~/components/basic/entry/base/BlockSlot.vue";
import EditableText from "~/components/basic/entry/base/EditableText.vue";
import type {InlineNode, SectionBlockData, TextNode} from "~/types/blocks";
import LinkEntryModal from "~/components/basic/entry/modals/LinkEntryModal.vue";
import Button from "~/components/basic/base/Button.vue";
import Block from "~/components/basic/entry/base/Block.vue";
import {useEntryUtils} from "~/composables/Entry/useEntryUtils";

const HEADING_TAGS: { [key: number]: string } = {
  0: "h1",
  1: "h2",
  2: "h3",
  3: "h4",
  4: "h5",
  5: "h6",
};

const HEADING_CLASSES: { [key: number]: string } = {
  0: "text-3xl font-bold", // H1
  1: "text-2xl font-bold", // H2
  2: "text-xl font-bold", // H3
  3: "text-lg font-bold", // H4
  4: "text-base font-bold", // H5
  5: "text-sm font-bold", // H6
};

const props = defineProps({
  block: {
    type: Object as PropType<GenericBlockComponentProps<SectionBlockData>["block"]>,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<SectionBlockData>["editorCallbacks"]
    >,
    default: () => ({}),
  },
  nestingLevel: {
    type: Number,
    default: 0,
  },
  renderBlocks: {
    type: Function as PropType<
        GenericBlockComponentProps<SectionBlockData>["renderBlocks"]
    >,
    required: true,
  },
  draggedBlockType: {
    type: String as PropType<
        GenericBlockComponentProps<SectionBlockData>["draggedBlockType"]
    >,
    default: null,
  },
  isChildAllowedInParent: {
    type: Function as PropType<
        GenericBlockComponentProps<SectionBlockData>["isChildAllowedInParent"]
    >,
    default: () => true,
  },
});

const { getEntryNameBySlug } = useEntryUtils(); // Destructure getEntryNameBySlug from the composable

const isModalOpen = ref(false);
const linkedArticleTitle = ref<string | null>(null);

const hasContent = computed(
    () => props.block.slots?.default && props.block.slots.default.length > 0,
);

const titleContent = computed<Array<TextNode | InlineNode>>(() => [
  { type: "text", text: props.block.attrs.title || "" },
]);

const handleTitleChange = (newContent: Array<TextNode | InlineNode>) => {
  const newTitle = newContent
      .map((node) => (node.type === "text" ? node.text : ""))
      .join("");
  props.editorCallbacks?.updateBlock?.(props.block.id, {
    attrs: {
      ...props.block.attrs,
      title: newTitle,
    },
  });
};

const blockSlotClasses = computed(() =>
    hasContent.value && props.isEditable ? "border-l-2 border-rimelight-primary-800" : "",
);

const headingClass = computed(
    () => HEADING_CLASSES[props.nestingLevel] || HEADING_CLASSES[5],
);
const placeholderText = computed(() => `Heading level ${props.nestingLevel + 1}`);
const semanticTag = computed(
    () => HEADING_TAGS[props.nestingLevel] || HEADING_TAGS[5],
);

const displayValue = computed(() => {
  return !props.isEditable && !props.block.attrs.title
      ? ([{ type: "text", text: placeholderText.value }] as TextNode[])
      : titleContent.value;
});

watch(
    () => props.block.attrs.mainArticleSlug,
    async (newSlug) => {
      if (newSlug) {
        try {
           // Use the destructured function
          linkedArticleTitle.value = await getEntryNameBySlug(newSlug);
        } catch (error) {
          console.error("Error fetching linked article title:", error);
          linkedArticleTitle.value = null;
        }
      } else {
        linkedArticleTitle.value = null;
      }
    },
    { immediate: true },
);

const handleSelectMainArticle = (slug: string) => {
  props.editorCallbacks?.updateBlock?.(props.block.id, {
    attrs: {
      ...props.block.attrs,
      mainArticleSlug: slug,
    },
  });
  isModalOpen.value = false;
};

const handleRemoveMainArticle = () => {
  props.editorCallbacks?.updateBlock?.(props.block.id, {
    attrs: {
      ...props.block.attrs,
      mainArticleSlug: null,
    },
  });
};

const sectionBlockActions = computed(() => {
  if (!props.isEditable) {
    return null;
  }

  const buttons = [];
  if (props.block.attrs.mainArticleSlug) {
    buttons.push(
        h(Button, {
          variant: "primary",
          size: "sm",
          text: "Change Link",
          onClick: () => (isModalOpen.value = true),
        }),
        h(Button, {
          variant: "danger",
          size: "sm",
          text: "Remove Link",
          onClick: handleRemoveMainArticle,
        }),
    );
  } else {
    buttons.push(
        h(Button, {
          variant: "primary",
          size: "sm",
          text: "Link to article",
          onClick: () => (isModalOpen.value = true),
        }),
    );
  }

  return h("div", { class: "flex items-center gap-sm" }, buttons);
});
</script>

<template>
  <Block
      :id="block.id"
      :type="block.type"
      :is-editable="isEditable"
      draggable
      nestable
      :is-templated="block.isTemplated"
      :block-actions="sectionBlockActions"
      @drag-start="editorCallbacks?.onDragStart"
      @duplicate="editorCallbacks?.duplicateBlock"
      @delete="editorCallbacks?.deleteBlock"
      @insert-block-above="editorCallbacks?.onInsertBlockAbove"
      @insert-block-below="editorCallbacks?.onInsertBlockBelow"
  >
    <section class="flex flex-col gap-md">
      <EditableText
          :value="displayValue"
          :is-editable="isEditable"
          :placeholder="placeholderText"
          :character-limit="128"
          :is-multiline="false"
          :supported-marks="[]"
          :class="headingClass"
          :editor-callbacks="editorCallbacks"
          :root-tag="semanticTag"
          :on-value-change="handleTitleChange"
          @update:value="handleTitleChange"
      />

      <p
          v-if="block.attrs.mainArticleSlug && (isEditable || linkedArticleTitle)"
          class="text-sm text-rimelight-primary-400 italic"
      >
        Main article:
        <strong
            v-if="isEditable"
            class="text-rimelight-secondary-500 italic"
        >
          {{ linkedArticleTitle || block.attrs.mainArticleSlug }}
        </strong>
        <NuxtLink
            v-else
            :to="`/${block.attrs.mainArticleSlug}`"
            class="text-rimelight-secondary-500 italic underline"
        >
          {{ linkedArticleTitle || block.attrs.mainArticleSlug }}
        </NuxtLink>
      </p>

      <BlockSlot
          :blocks="block.slots?.default || []"
          :is-editable="isEditable"
          :editor-callbacks="editorCallbacks"
          :class="blockSlotClasses"
          :parent-id="block.id"
          :parent-block-type="block.type"
          :render-blocks="renderBlocks"
          :parent-nesting-level="nestingLevel"
          :dragged-block-type="draggedBlockType"
          :is-child-allowed-in-parent="isChildAllowedInParent"
      />

      <LinkEntryModal
          v-if="isModalOpen"
          :is-open="isModalOpen"
          @close="isModalOpen = false"
          @select-entry="handleSelectMainArticle"
      />
    </section>
  </Block>
</template>

<style>

</style>