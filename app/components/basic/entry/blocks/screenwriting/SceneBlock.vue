<template>
  <Block
      :id="block.id"
      :type="block.type"
      :is-editable="isEditable"
      :draggable="draggable"
      :nestable="nestable"
      :is-templated="isTemplated"
      @drag-start="editorCallbacks?.onDragStart"
      @duplicate="editorCallbacks?.duplicateBlock"
      @delete="editorCallbacks?.deleteBlock"
      @insert-block-above="editorCallbacks?.onInsertBlockAbove"
      @insert-block-below="editorCallbacks?.onInsertBlockBelow"
  >
    <div
        :data-block-type="block.type"
        :class="[
        'flex flex-col gap-md border border-rimelight-primary-500 p-lg',
        { 'hover:border-rimelight-primary-500': isEditable },
      ]"
    >
      <span class="text-xl font-bold text-rimelight-primary-100">
        Scene Block
      </span>
      <div class="flex flex-row gap-md">
        <EditableSelect
            :block-id="`${block.id}-timeOfDay`"
            :value="timeOfDay"
            :options="timeOfDayOptions"
            :is-editable="isEditable"
            class=""
            :editor-callbacks="editorCallbacks"
            width="w-64"
            :placeholder="getStaticEnumPlaceholder('timeOfDay', timeOfDay)"
            @update:value="handleTimeOfDayChange"
        />
        <EditableSelect
            :block-id="`${block.id}-setting`"
            :value="setting"
            :options="settingOptions"
            :is-editable="isEditable"
            class=""
            :editor-callbacks="editorCallbacks"
            width="w-64"
            :placeholder="getStaticEnumPlaceholder('setting', setting)"
            @update:value="handleSettingChange"
        />
        <EditableSelect
            :block-id="`${block.id}-transition`"
            :value="transition"
            :options="transitionOptions"
            :is-editable="isEditable"
            class=""
            :editor-callbacks="editorCallbacks"
            width="w-64"
            :placeholder="getStaticEnumPlaceholder('transition', transition)"
            @update:value="handleTransitionChange"
        />
      </div>

      <div class="flex flex-col gap-sm">
        <span class="font-semibold text-rimelight-primary-100">Location</span>
        <EditableText
            :value="locationContent"
            :is-editable="isEditable"
            placeholder="Enter location"
            :character-limit="128"
            :is-multiline="false"
            :supported-marks="[]"
            class="w-full"
            :editor-callbacks="editorCallbacks"
            :on-value-change="handleLocationChange"
            @update:value="handleLocationChange"
        />
      </div>
      <div class="flex flex-col gap-sm">
        <span class="font-semibold text-rimelight-primary-100">
          Description
        </span>
        <EditableText
            :value="descriptionContent"
            :is-editable="isEditable"
            placeholder="Enter description"
            :character-limit="512"
            :supported-marks="[]"
            class="w-full"
            :editor-callbacks="editorCallbacks"
            :on-value-change="handleDescriptionChange"
            @update:value="handleDescriptionChange"
        />
      </div>

      <BlockSlot
          :blocks="block.slots?.default || []"
          :is-editable="isEditable"
          :editor-callbacks="editorCallbacks"
          class=""
          :allowed-blocks="['paragraph', 'callout', 'dialogue']"
          :parent-id="block.id"
          :parent-block-type="block.type"
          :render-blocks="renderBlocks"
          :parent-nesting-level="nestingLevel"
          :dragged-block-type="draggedBlockType"
          :is-child-allowed-in-parent="editorCallbacks?.isChildAllowedInParent || (() => true)"
          slot-name="default"
      />
    </div>
  </Block>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import type {
  SceneBlockData,
  TimeOfDay,
  Setting,
  Transition,
  TextNode,
  InlineNode,
} from "~/types/blocks";
import EditableText from "~/components/basic/entry/base/EditableText.vue";
import EditableSelect from "~/components/basic/entry/base/EditableSelect.vue";
import BlockSlot from "~/components/basic/entry/base/BlockSlot.vue";
import Block from "~/components/basic/entry/base/Block.vue";

const props = defineProps({
  block: {
    type: Object as PropType<
        GenericBlockComponentProps<SceneBlockData>["block"]
    >,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<SceneBlockData>["editorCallbacks"]
    >,
    default: () => ({}),
  },
  nestingLevel: {
    type: Number,
    default: 0,
  },
  renderBlocks: {
    type: Function as PropType<
        GenericBlockComponentProps<SceneBlockData>["renderBlocks"]
    >,
    required: true,
  },
  draggedBlockType: {
    type: String as PropType<
        GenericBlockComponentProps<SceneBlockData>["draggedBlockType"]
    >,
    default: null,
  },
  isChildAllowedInParent: {
    type: Function as PropType<
        GenericBlockComponentProps<SceneBlockData>["isChildAllowedInParent"]
    >,
    default: () => true,
  },
  draggable: {
    type: Boolean,
    default: false,
  },
  nestable: {
    type: Boolean,
    default: false, // Explicitly listing for clarity, though it might be true for SceneBlock if it can be nested in a ScriptBlock.
  },
  isTemplated: {
    type: Boolean,
    default: false,
  },
});

const { id, attrs } = props.block;
const {
  location = "",
  timeOfDay = "MORNING",
  setting = "INTERIOR",
  transition = "CUT_TO_SCENE",
  description = "",
} = attrs || {};

// Defined as readonly arrays to ensure type safety and immutability
const timeOfDayOptions: readonly TimeOfDay[] = [
  "MORNING",
  "NOON",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
  "OTHER",
];
const settingOptions: readonly Setting[] = ["INTERIOR", "EXTERIOR", "OTHER"];
const transitionOptions: readonly Transition[] = [
  "CUT_TO_SCENE",
  "CUT_BACK_TO_SCENE",
  "FADE_TO_SCENE",
];

const locationContent = computed<Array<TextNode | InlineNode>>(() => {
  return [{ type: "text", text: location || "" }];
});
const descriptionContent = computed<Array<TextNode | InlineNode>>(() => {
  return [{ type: "text", text: description || "" }];
});

// Replaced useCallback with a regular function in setup, as reactivity handles dependencies.
const getStaticEnumPlaceholder = (
    type: "timeOfDay" | "setting" | "transition",
    value: string,
) => {
  switch (type) {
    case "timeOfDay":
      switch (value as TimeOfDay) {
        case "MORNING":
          return "Morning";
        case "NOON":
          return "Noon";
        case "AFTERNOON":
          return "Afternoon";
        case "EVENING":
          return "Evening";
        case "NIGHT":
          return "Night";
        case "OTHER":
          return "Other";
        default:
          return "";
      }
    case "setting":
      switch (value as Setting) {
        case "INTERIOR":
          return "Interior";
        case "EXTERIOR":
          return "Exterior";
        case "OTHER":
          return "Other";
        default:
          return "";
      }
    case "transition":
      switch (value as Transition) {
        case "CUT_TO_SCENE":
          return "Cut to Scene";
        case "CUT_BACK_TO_SCENE":
          return "Cut Back to Scene";
        case "FADE_TO_SCENE":
          return "Fade to Scene";
        default:
          return "";
      }
    default:
      return "";
  }
};

const handleLocationChange = (newContent: Array<TextNode | InlineNode>) => {
  const newLocation = newContent
      .map((node) => (node.type === "text" ? node.text : ""))
      .join("");
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: { ...attrs, location: newLocation },
  });
};

const handleTimeOfDayChange = (newTime: TimeOfDay) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: { ...attrs, timeOfDay: newTime },
  });
};

const handleSettingChange = (newSetting: Setting) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: { ...attrs, setting: newSetting },
  });
};

const handleTransitionChange = (newTransition: Transition) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: { ...attrs, transition: newTransition },
  });
};

const handleDescriptionChange = (
    newContent: Array<TextNode | InlineNode>,
) => {
  const newDescription = newContent
      .map((node) => (node.type === "text" ? node.text : ""))
      .join("");
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: { ...attrs, description: newDescription },
  });
};
</script>