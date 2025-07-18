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
        ref="calloutRef"
        :class="[
        'flex flex-row items-start gap-lg border bg-rimelight-primary-800 p-lg relative',
        variantDetails.borderColorClass,
      ]"
    >
      <template v-if="isEditable">
        <Button
            ref="iconTriggerRef"
            :start-icon="variantDetails.icon"
            :icon-props="{ className: variantDetails.fillColorClass }"
            size="md"
            type="button"
            variant="ghost"
            aria-haspopup="true"
            :aria-expanded="isMenuOpen"
            :aria-label="`Change callout variant (current: ${variantDetails.title})`"
            class="p-md"
            @click="toggleMenu"
            @keydown="handleIconButtonKeyDown"
        />
      </template>
      <template v-else>
        <Icon :name="variantDetails.icon" size="md" />
      </template>

      <Teleport to="body">
        <div
            v-if="isMenuOpen && isEditable && menuPosition"
            ref="menuRef"
            :class="[
            'fixed z-50 w-128 border border-rimelight-primary-500 bg-rimelight-primary-900 p-md shadow-lg',
          ]"
            role="menu"
            :style="{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }"
        >
          <div
              v-for="([variantKey, details]) in Object.entries(localizedVariantDetails)"
              :key="variantKey"
              :class="[
              'flex cursor-pointer gap-lg border border-transparent p-md hover:border-rimelight-primary-500 hover:bg-rimelight-primary-700',
            ]"
              :tabindex="isEditable ? 0 : -1"
              role="menuitem"
              :aria-label="`Select ${details.title} variant`"
              @click="isEditable ? handleVariantSelect(variantKey as CalloutVariant) : undefined"
              @keydown="isEditable ? (event) => handleMenuItemKeyDown(event, variantKey as CalloutVariant) : undefined"
          >
            <Icon
                :name="details.icon"
                size="md"
                :class="`fill-current object-contain ${details.fillColorClass} flex-shrink-0`"
            />
            <div class="flex flex-col items-start">
              <span :class="`text-sm font-semibold ${details.textColorClass}`">
                {{ details.title }}
              </span>
              <span
                  v-if="details.tooltip"
                  class="text-left text-xs text-rimelight-primary-100"
              >
                {{ details.tooltip }}
              </span>
            </div>
          </div>
        </div>
      </Teleport>

      <div v-if="variantDetails.tooltip" class="absolute top-4 right-4">
        <Tooltip :content="variantDetails.tooltip" position="right">
          <Icon
              name="tooltip"
              size="md"
              :class="`fill-current ${variantDetails.fillColorClass} cursor-help object-contain`"
          />
        </Tooltip>
      </div>

      <div class="flex w-full flex-col">
        <span :class="`text-lg font-semibold ${variantDetails.textColorClass}`">
          {{ variantDetails.title }}
        </span>
        <EditableText
            :value="currentTextContent"
            :is-editable="isEditable"
            placeholder="Add callout text"
            :character-limit="512"
            :is-multiline="true"
            :supported-marks="['bold', 'italic', 'underline', 'link']"
            :editor-callbacks="editorCallbacks"
            :on-value-change="handleTextChange"
            @update:value="handleTextChange"
        />
      </div>
    </div>
  </Block>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { PropType } from "vue";
import type { GenericBlockComponentProps } from "~/config/blocks/blockSchema";
import EditableText from "~/components/basic/entry/base/EditableText.vue";
import type {
  CalloutBlockData,
  CalloutVariant,
  CalloutBlockAttrs,
  TextNode,
  InlineNode,
} from "~/types/blocks";
import Icon from "~/components/basic/base/Icon.vue";
import Button from "~/components/basic/base/Button.vue";
import type { IconName } from "~/types/Icons";
import Tooltip from "~/components/basic/base/Tooltip.vue";
import Block from "~/components/basic/entry/base/Block.vue";

const CalloutVariantDetails: Record<
    CalloutVariant,
    {
      icon: IconName;
      borderColorClass: string;
      textColorClass: string;
      fillColorClass: string;
    }
> = {
  note: {
    icon: "blocks.text.calloutVariants.note",
    borderColorClass: "border-rimelight-callout-note",
    textColorClass: "text-rimelight-callout-note",
    fillColorClass: "text-rimelight-callout-note",
  },
  tip: {
    icon: "blocks.text.calloutVariants.tip",
    borderColorClass: "border-rimelight-callout-tip",
    textColorClass: "text-rimelight-callout-tip",
    fillColorClass: "text-rimelight-callout-tip",
  },
  warning: {
    icon: "blocks.text.calloutVariants.warning",
    borderColorClass: "border-rimelight-callout-warning",
    textColorClass: "text-rimelight-callout-warning",
    fillColorClass: "text-rimelight-callout-warning",
  },
  danger: {
    icon: "blocks.text.calloutVariants.danger",
    borderColorClass: "border-rimelight-callout-danger",
    textColorClass: "text-rimelight-callout-danger",
    fillColorClass: "text-rimelight-callout-danger",
  },
  commentaryInternal: {
    icon: "blocks.text.calloutVariants.commentaryInternal",
    borderColorClass: "border-rimelight-callout-commentary-internal",
    textColorClass: "text-rimelight-callout-commentary-internal",
    fillColorClass: "text-rimelight-callout-commentary-internal",
  },
  commentaryExternal: {
    icon: "blocks.text.calloutVariants.commentaryExternal",
    borderColorClass: "border-rimelight-callout-commentary-external",
    textColorClass: "text-rimelight-callout-commentary-external",
    fillColorClass: "text-rimelight-callout-commentary-external",
  },
  ideation: {
    icon: "blocks.text.calloutVariants.ideation",
    borderColorClass: "border-rimelight-callout-ideation",
    textColorClass: "text-rimelight-callout-ideation",
    fillColorClass: "text-rimelight-callout-ideation",
  },
  creatorInternal: {
    icon: "blocks.text.calloutVariants.creatorInternal",
    borderColorClass: "border-rimelight-callout-creator-internal",
    textColorClass: "text-rimelight-callout-creator-internal",
    fillColorClass: "text-rimelight-callout-creator-internal",
  },
  creatorExternal: {
    icon: "blocks.text.calloutVariants.creatorExternal",
    borderColorClass: "border-rimelight-callout-creator-external",
    textColorClass: "text-rimelight-callout-creator-external",
    fillColorClass: "text-rimelight-callout-creator-external",
  },
};

const props = defineProps({
  block: {
    type: Object as PropType<
        GenericBlockComponentProps<CalloutBlockData>["block"]
    >,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
  editorCallbacks: {
    type: Object as PropType<
        GenericBlockComponentProps<CalloutBlockData>["editorCallbacks"]
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
const { variant = "note" } = attrs || {};

const isMenuOpen = ref(false);
const calloutRef = ref<HTMLDivElement | null>(null);
const iconTriggerRef = ref<HTMLButtonElement | HTMLSpanElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);

const menuPosition = ref<{ x: number; y: number } | null>(null);

const currentTextContent = computed<Array<TextNode | InlineNode>>(() => {
  return Array.isArray(attrs?.text)
      ? (attrs.text as Array<TextNode | InlineNode>)
      : ([{ type: "text", text: String(attrs?.text || "") }] as Array<TextNode | InlineNode>);
});

const CALLOUT_MESSAGES = computed(() => ({
  note: {
    title: "Note",
    tooltip: "This callout is used for general notes.",
  },
  tip: {
    title: "Tip",
    tooltip: "This callout is for sharing tips and tricks.",
  },
  warning: {
    title: "Warning",
    tooltip: "This callout highlights potential issues or warnings.",
  },
  danger: {
    title: "Danger",
    tooltip: "This callout indicates critical information or danger.",
  },
  commentaryInternal: {
    title: "Commentary (Internal)",
    tooltip:
        "This callout is for internal commentary or notes not meant for external consumption",
  },
  commentaryExternal: {
    title: "Commentary",
    tooltip: "This callout is used for direct developer commentary.",
  },
  ideation: {
    title: "Ideation",
    tooltip: `This callout is used for writing down ideas on a topic and brainstorming. Proper formatting within this block isn't strictly necessary.`,
  },
  creatorInternal: {
    title: `Creator's Remarks (Internal)`,
    tooltip: `This callout is used for direct commentary by Rimelight Entertainment's creator. This block is not visible to users.`,
  },
  creatorExternal: {
    title: `Creator's Remarks`,
    tooltip: `This callout is used for direct commentary by Rimelight Entertainment's creator.`,
  },
}));

const localizedVariantDetails = computed(() => {
  return Object.fromEntries(
      Object.entries(CalloutVariantDetails).map(([key, details]) => {
        const variantKey = key as CalloutVariant;
        const messages = CALLOUT_MESSAGES.value[variantKey]; // Access .value for the reactive object
        return [
          variantKey,
          {
            ...details,
            title: messages.title,
            tooltip: messages.tooltip,
          },
        ];
      }),
  ) as Record<
      CalloutVariant,
      {
        icon: IconName;
        title: string;
        tooltip: string;
        borderColorClass: string;
        textColorClass: string;
        fillColorClass: string;
      }
  >;
});

const variantDetails = computed(() => {
  return localizedVariantDetails.value[variant] || localizedVariantDetails.value.note;
});

const handleTextChange = (newContent: Array<TextNode | InlineNode>) => {
  props.editorCallbacks?.updateBlock?.(id, {
    attrs: {
      ...attrs,
      text: newContent,
      variant: variant, // Ensure variant is preserved
    } as CalloutBlockAttrs,
  });
};

const calculateMenuPosition = () => {
  if (!iconTriggerRef.value) return;

  const buttonRect = iconTriggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const menuHeight = menuRef.value ? menuRef.value.offsetHeight : 0;

  const spacing = 5;

  const preferredY = buttonRect.bottom + spacing;

  const newY =
      preferredY + menuHeight > viewportHeight &&
      buttonRect.top - menuHeight - spacing >= 0
          ? buttonRect.top - menuHeight - spacing
          : preferredY;

  const newX = buttonRect.left;

  menuPosition.value = {
    x: newX,
    y: newY,
  };
};

const handleVariantSelect = (selectedVariant: CalloutVariant) => {
  if (props.editorCallbacks?.updateBlock) {
    props.editorCallbacks.updateBlock(id, {
      attrs: {
        ...attrs,
        variant: selectedVariant,
      } as CalloutBlockAttrs,
    });
  } else {
    console.error(
        `CalloutBlock (ID: ${id}): editorCallbacks or editorCallbacks.updateBlock is missing! Cannot update variant.`,
    );
  }
  isMenuOpen.value = false;
  menuPosition.value = null;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    // Wait for the menu to be rendered before calculating position
    requestAnimationFrame(() => {
      calculateMenuPosition();
    });
  } else {
    menuPosition.value = null;
  }
};

const handleIconButtonKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu();
  }
};

const handleMenuItemKeyDown = (
    event: KeyboardEvent,
    variantKey: CalloutVariant,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleVariantSelect(variantKey);
  }
};

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
        isMenuOpen.value &&
        menuRef.value &&
        !menuRef.value.contains(event.target as Node) &&
        iconTriggerRef.value &&
        !iconTriggerRef.value.contains(event.target as Node)
    ) {
      isMenuOpen.value = false;
      menuPosition.value = null;
    }
  };

  const handleScrollOrResizeMenu = () => {
    if (isMenuOpen.value) {
      calculateMenuPosition();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleScrollOrResizeMenu);
  window.addEventListener("resize", handleScrollOrResizeMenu);

  onUnmounted(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("scroll", handleScrollOrResizeMenu);
    window.removeEventListener("resize", handleScrollOrResizeMenu);
  });
});

watch(isMenuOpen, (newVal) => {
  if (newVal) {
    requestAnimationFrame(() => {
      calculateMenuPosition();
    });
  }
});

watch(
    () => props.isEditable,
    (newVal) => {
      if (!newVal) {
        isMenuOpen.value = false;
        menuPosition.value = null;
      }
    },
);
</script>