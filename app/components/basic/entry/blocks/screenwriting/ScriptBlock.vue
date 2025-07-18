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
        class="flex flex-col gap-md border border-rimelight-primary-500 bg-rimelight-primary-800 p-lg shadow-lg"
    >
      <span class="text-3xl font-bold text-rimelight-primary-100">
        Script Block
      </span>

      <div class="flex flex-col gap-sm rounded-md">
        <span class="text-xl font-bold text-rimelight-primary-100">
          Overview
        </span>

        <div class="flex flex-col gap-xs">
          <span class="text-base font-bold text-rimelight-primary-100">
            Title
          </span>
          <EditableText
              :value="titleContent"
              :is-editable="isEditable"
              placeholder="Title"
              :is-multiline="false"
              :character-limit="24"
              :supported-marks="['bold', 'italic']"
              class="text-rimelight-neutral-50"
              :editor-callbacks="editorCallbacks"
              :on-value-change="handleTitleChange"
              @update:value="handleTitleChange"
          />
        </div>

        <div class="flex flex-col gap-xs">
          <span class="text-base font-bold text-rimelight-primary-100">
            Synopsis
          </span>
          <EditableText
              :value="synopsisContent"
              :is-editable="isEditable"
              placeholder="Synopsis"
              :is-multiline="true"
              :character-limit="256"
              :supported-marks="['bold', 'italic', 'underline']"
              class="text-rimelight-primary-100"
              :editor-callbacks="editorCallbacks"
              :on-value-change="handleSynopsisChange"
              @update:value="handleSynopsisChange"
          />
        </div>
      </div>

      <div class="flex flex-col gap-sm rounded-md">
        <span class="text-xl font-semibold text-rimelight-primary-100">
          Characters
        </span>

        <div v-if="isEditable" class="flex gap-sm">
          <EditableText
              :value="newCharacterName"
              :is-editable="isEditable"
              placeholder="Add Character"
              :character-limit="64"
              :is-multiline="false"
              :supported-marks="[]"
              class="flex-grow"
              :editor-callbacks="editorCallbacks"
              :on-value-change="handleNewCharacterNameChange"
              @update:value="handleNewCharacterNameChange"
          />
          <Button
              variant="primary"
              size="sm"
              text="Add Character"
              :disabled="newCharacterNameText.trim() === ''"
              @click="handleAddCharacter"
          />
        </div>

        <div class="flex flex-col gap-md">
          <span v-if="characters.length === 0" class="text-rimelight-primary-600 italic">
            No characters added yet.
          </span>
          <div
              v-for="char in characters"
              :key="char"
              class="flex w-fit items-center gap-sm border border-rimelight-primary-500 bg-rimelight-primary-700 p-sm px-2 text-sm text-rimelight-primary-100"
          >
            {{ char }}
            <Button
                v-if="isEditable"
                type="button"
                variant="ghost"
                size="xs"
                start-icon="delete"
                aria-label="Remove Character"
                class="hover:text-rimelight-error text-rimelight-primary-100"
                @click="handleRemoveCharacter(char)"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-sm">
        <span class="text-xl font-bold text-rimelight-primary-100">
          Structure
        </span>

        <div class="flex flex-col gap-sm">
          <span class="text-lg font-bold text-rimelight-primary-100">
            Plots
          </span>

          <div class="flex flex-col gap-xs">
            <span class="text-base font-bold text-rimelight-primary-100">
              A Plot
            </span>
            <EditableText
                :value="aPlotContent"
                :is-editable="isEditable"
                placeholder="A Plot"
                :is-multiline="true"
                :supported-marks="['bold', 'italic', 'underline']"
                class="text-rimelight-neutral-50"
                :editor-callbacks="editorCallbacks"
                :on-value-change="handleAPlotChange"
                @update:value="handleAPlotChange"
            />
          </div>

          <div class="flex flex-col gap-xs">
            <span class="text-base font-bold text-rimelight-primary-100">
              B Plot
            </span>
            <EditableText
                :value="bPlotContent"
                :is-editable="isEditable"
                placeholder="B Plot"
                :is-multiline="true"
                :supported-marks="['bold', 'italic', 'underline']"
                class="text-rimelight-neutral-50"
                :editor-callbacks="editorCallbacks"
                :on-value-change="handleBPlotChange"
                @update:value="handleBPlotChange"
            />
          </div>

          <div class="flex flex-col gap-xs">
            <span class="text-base font-bold text-rimelight-primary-100">
              C Plot
            </span>
            <EditableText
                :value="cPlotContent"
                :is-editable="isEditable"
                placeholder="C Plot"
                :is-multiline="true"
                :supported-marks="['bold', 'italic', 'underline']"
                class="text-rimelight-neutral-50"
                :editor-callbacks="editorCallbacks"
                :on-value-change="handleCPlotChange"
                @update:value="handleCPlotChange"
            />
          </div>
        </div>

        <div class="flex flex-col gap-sm">
          <span class="text-lg font-semibold text-rimelight-primary-100">
            Stinger
          </span>
          <EditableText
              :value="stingerContent"
              :is-editable="isEditable"
              placeholder="Stinger"
              :is-multiline="true"
              :supported-marks="['bold', 'italic', 'underline']"
              class="text-rimelight-primary-100"
              :editor-callbacks="editorCallbacks"
              :on-value-change="handleStingerChange"
              @update:value="handleStingerChange"
          />
        </div>
      </div>

      <span class="text-xl font-bold text-rimelight-primary-100">Act 1</span>
      <BlockSlot
          :blocks="block.slots?.act1 || []"
          :is-editable="isEditable"
          :editor-callbacks="editorCallbacks"
          class=""
          :allowed-blocks="['scene']"
          :parent-id="id"
          :parent-block-type="block.type"
          :render-blocks="renderBlocks"
          :parent-nesting-level="nestingLevel"
          :dragged-block-type="draggedBlockType"
          :is-child-allowed-in-parent="isChildAllowedInParent"
          slot-name="act1"
      />
      <span class="text-xl font-bold text-rimelight-primary-100">Act 2</span>
      <BlockSlot
          :blocks="block.slots?.act2 || []"
          :is-editable="isEditable"
          :editor-callbacks="editorCallbacks"
          class=""
          :allowed-blocks="['scene']"
          :parent-id="id"
          :parent-block-type="block.type"
          :render-blocks="renderBlocks"
          :parent-nesting-level="nestingLevel"
          :dragged-block-type="draggedBlockType"
          :is-child-allowed-in-parent="isChildAllowedInParent"
          slot-name="act2"
      />
      <span class="text-xl font-bold text-rimelight-primary-100">Act 3</span>
      <BlockSlot
          :blocks="block.slots?.act3 || []"
          :is-editable="isEditable"
          :editor-callbacks="editorCallbacks"
          class=""
          :allowed-blocks="['scene']"
          :parent-id="id"
          :parent-block-type="block.type"
          :render-blocks="renderBlocks"
          :parent-nesting-level="nestingLevel"
          :dragged-block-type="draggedBlockType"
          :is-child-allowed-in-parent="isChildAllowedInParent"
          slot-name="act3"
      />
    </div>
  </Block>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import type {
  ScriptBlockAttrs,
  ScriptBlockData,
  TextNode,
  InlineNode,
} from "~/types/blocks";
import BlockSlot from "~/components/basic/entry/base/BlockSlot.vue";
import EditableText from "~/components/basic/entry/base/EditableText.vue";
import Button from "~/components/basic/base/Button.vue";
import Block from "~/components/basic/entry/base/Block.vue";

const props = defineProps({
  block: {
    type: Object as PropType<
        GenericBlockComponentProps<ScriptBlockData>["block"]
    >,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<ScriptBlockData>["editorCallbacks"]
    >,
    default: () => ({}),
  },
  nestingLevel: {
    type: Number,
    default: 0,
  },
  renderBlocks: {
    type: Function as PropType<
        GenericBlockComponentProps<ScriptBlockData>["renderBlocks"]
    >,
    required: true,
  },
  draggedBlockType: {
    type: String as PropType<
        GenericBlockComponentProps<ScriptBlockData>["draggedBlockType"]
    >,
    default: null,
  },
  isChildAllowedInParent: {
    type: Function as PropType<
        GenericBlockComponentProps<ScriptBlockData>["isChildAllowedInParent"]
    >,
    default: () => true,
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

// Use computed properties to ensure reactivity for content that might change via block updates
const characters = computed<string[]>(
    () => (attrs?.characters || []) as string[],
);
const aPlotContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.aPlot) ? attrs.aPlot : [],
);
const bPlotContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.bPlot) ? attrs.bPlot : [],
);
const cPlotContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.cPlot) ? attrs.cPlot : [],
);
const stingerContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.stinger) ? attrs.stinger : [],
);
const titleContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.title) ? attrs.title : [],
);
const synopsisContent = computed<Array<TextNode | InlineNode>>(() =>
    Array.isArray(attrs?.synopsis) ? attrs.synopsis : [],
);

const newCharacterName = ref<Array<TextNode | InlineNode>>([
  { type: "text", text: "" },
]);

const newCharacterNameText = computed(() =>
    newCharacterName.value
        .map((node) => (node.type === "text" ? node.text : ""))
        .join(""),
);

const handleNewCharacterNameChange = (
    newContent: Array<TextNode | InlineNode>,
) => {
  newCharacterName.value = newContent;
};

const handleAddCharacter = () => {
  const characterToAdd = newCharacterNameText.value.trim();
  if (characterToAdd && !characters.value.includes(characterToAdd)) {
    const updatedCharacters = [...characters.value, characterToAdd].sort(
        (a, b) => a.localeCompare(b),
    );
    props.editorCallbacks?.updateBlock?.(id, {
      attrs: {
        ...attrs,
        characters: updatedCharacters,
      } as ScriptBlockAttrs,
    });
    newCharacterName.value = [{ type: "text", text: "" }];
  }
};

const handleRemoveCharacter = (characterToRemove: string) => {
  const updatedCharacters = characters.value.filter(
      (char) => char !== characterToRemove,
  );

  if (props.editorCallbacks?.updateBlock) {
    props.editorCallbacks.updateBlock(id, {
      attrs: {
        ...attrs,
        characters: updatedCharacters,
      } as ScriptBlockAttrs,
    });
  } else {
    console.warn(`ScriptBlock ${id}: editorCallbacks.updateBlock is undefined.`);
  }

  if (props.editorCallbacks?.onCharacterRemovedFromScript) {
    props.editorCallbacks.onCharacterRemovedFromScript(characterToRemove, id);
  } else {
    console.warn(
        `ScriptBlock ${id}: editorCallbacks.onCharacterRemovedFromScript is undefined.`,
    );
  }
};

// Handlers for Plot and Stinger content changes
const handleAPlotChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      aPlot: newContent,
    } as ScriptBlockAttrs,
  });
};

const handleBPlotChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      bPlot: newContent,
    } as ScriptBlockAttrs,
  });
};

const handleCPlotChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      cPlot: newContent,
    } as ScriptBlockAttrs,
  });
};

const handleStingerChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      stinger: newContent,
    } as ScriptBlockAttrs,
  });
};

const handleTitleChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      title: newContent,
    } as ScriptBlockAttrs,
  });
};

const handleSynopsisChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      synopsis: newContent,
    } as ScriptBlockAttrs,
  });
};
</script>