<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import EditableText from "~/components/entry/base/EditableText.vue";
import EditableSelect from "~/components/entry/base/EditableSelect.vue";
import type {
  DialogueBlockData,
  DialogueBlockAttrs,
  TextNode,
  InlineNode,
} from "~/types/blocks";
import Block from "~/components/entry/base/Block.vue";


/**
 * A custom block component representing a character's dialogue line.
 */

const props = defineProps({
  block: {
    type: Object as PropType<
        GenericBlockComponentProps<DialogueBlockData>["block"]
    >,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<DialogueBlockData>["editorCallbacks"]
    >,
    default: () => ({}),
  },
  draggable: {
    type: Boolean,
    default: false,
  },
  nestable: {
    type: Boolean,
    default: false,
  },
  isTemplated: {
    type: Boolean,
    default: false,
  },
});

const { id, attrs } = props.block;
const { character = "", parenthetical = "", line = [] } = attrs || {};

// State to hold available characters fetched from parent ScriptBlock
const availableCharacters = ref<string[]>([]);

// Equivalent of React's useEffect for initial data fetching and reactions
const fetchAvailableCharacters = () => {
  if (props.editorCallbacks?.getAvailableCharactersForDialogue) {
    const charactersFromParent =
        props.editorCallbacks.getAvailableCharactersForDialogue(id);
    availableCharacters.value = charactersFromParent.sort((a, b) =>
        a.localeCompare(b),
    );
  }
};

onMounted(() => {
  fetchAvailableCharacters();
});

// Watch for changes in editorCallbacks or block.id if `getAvailableCharactersForDialogue`
// might return different results based on these or if the block moves/reloads.
watch(
    () => [props.editorCallbacks, props.block.id],
    () => {
      fetchAvailableCharacters();
    },
    { deep: true },
);

const handleCharacterChange = (newCharacter: string) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      character: newCharacter,
    } as DialogueBlockAttrs,
  });
};

const parentheticalContent = computed<Array<TextNode | InlineNode>>(() => {
  return [{ type: "text", text: parenthetical || "" }];
});

const handleParentheticalChange = (
    newContent: Array<TextNode | InlineNode>,
) => {
  const newParenthetical = newContent
      .map((node) => (node.type === "text" ? node.text : ""))
      .join("");
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      parenthetical: newParenthetical,
    } as DialogueBlockAttrs,
  });
};

const handleLineChange = (newLineContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      line: newLineContent,
    } as DialogueBlockAttrs,
  });
};

const optionsForSelect = computed(() => {
  if (props.isEditable) {
    return availableCharacters.value;
  } else {
    return availableCharacters.value.includes(character)
        ? availableCharacters.value
        : [character, ...availableCharacters.value];
  }
});
</script>

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
        :class="[
        'mx-auto flex max-w-128 flex-col items-center gap-xs p-md',
        { 'border border-rimelight-primary-500': isEditable },
      ]"
    >
      <EditableSelect
          :block-id="`${block.id}-character`"
          :value="character"
          :options="optionsForSelect"
          :is-editable="isEditable"
          placeholder="Character Name"
          :class="[
          'w-full text-center text-md uppercase',
          { 'border-none p-0': !isEditable },
        ]"
          :editor-callbacks="editorCallbacks"
          @update:value="handleCharacterChange"
      />
      <EditableText
          :value="parentheticalContent"
          :is-editable="isEditable"
          placeholder="(e.g., quietly)"
          :character-limit="64"
          :supported-marks="[]"
          class="w-full text-center text-md lowercase italic"
          :editor-callbacks="editorCallbacks"
          :on-value-change="handleParentheticalChange"
          @update:value="handleParentheticalChange"
      />
      <EditableText
          :value="line"
          :is-editable="isEditable"
          placeholder="Dialogue line goes here..."
          :character-limit="256"
          :supported-marks="['bold', 'italic', 'underline']"
          class="w-full text-center text-md"
          :editor-callbacks="editorCallbacks"
          :on-value-change="handleLineChange"
          @update:value="handleLineChange"
      />
    </div>
  </Block>
</template>