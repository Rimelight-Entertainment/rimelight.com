<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { Ref } from 'vue'; // Removed VNode as it's no longer a prop type
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';

const tooltipVariants = cva(
    "fixed max-w-xs border shadow-lg transition-opacity duration-200 z-50 whitespace-normal break-words",
    {
      variants: {
        colorScheme: {
          rimelight:
              "border-rimelight-primary-500 bg-rimelight-primary-900 text-rimelight-primary-100",
        },
        size: {
          sm: "p-sm text-xs",
          md: "p-md text-sm",
          lg: "p-lg text-base",
        },
      },
      defaultVariants: {
        colorScheme: "rimelight",
        size: "md",
      },
    },
);

type TooltipVariants = /* @vue-ignore */ VariantProps<typeof tooltipVariants>;

interface TooltipPropsBase {
  /**
   * Optional class names for the tooltip content container.
   */
  className?: string;
  /**
   * Optional offset from the trigger element in pixels.
   * Default is 8 px.
   */
  offset?: number;
  /**
   * Where the tooltip should ideally appear relative to the trigger.
   * 'right' (default), 'left', 'top', 'bottom'.
   */
  position?: 'right' | 'left' | 'top' | 'bottom';
  /**
   * Whether the tooltip should be shown. Can be controlled externally.
   * Defaults to internal state management if not provided.
   */
  isVisible?: boolean;
  /**
   * If true, the tooltip will always be visible.
   */
  alwaysVisible?: boolean;
  /**
   * If true, the tooltip will be disabled and not show.
   */
  isDisabled?: boolean;
}

interface TooltipPropsWithExternalTrigger extends TooltipPropsBase {
  externalTriggerRef?: Ref<HTMLElement | null> | HTMLElement | null;
}

interface TooltipPropsWithoutExternalTrigger extends TooltipPropsBase {
  externalTriggerRef?: undefined;
}

type TooltipProps = (
    | TooltipPropsWithExternalTrigger
    | TooltipPropsWithoutExternalTrigger
    ) & TooltipVariants;

const props = withDefaults(defineProps<TooltipProps>(), {
  offset: 8,
  position: 'right',
  alwaysVisible: false,
  isDisabled: false,
  externalTriggerRef: undefined,
});

const emit = defineEmits<{
  (e: 'update:isVisible' | 'visibilityChange', value: boolean): void;
}>();

const internalIsVisible = ref(false);
const isVisible = computed(() =>
    props.alwaysVisible ||
    (props.isVisible !== undefined ? props.isVisible : internalIsVisible.value)
);

const internalTriggerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);
const tooltipPosition = ref<{ x: number; y: number } | null>(null);

const currentTriggerElementForPosition = computed(() => {
  if (props.externalTriggerRef && 'value' in props.externalTriggerRef) {
    return props.externalTriggerRef.value;
  }
  return props.externalTriggerRef || internalTriggerRef.value;
});

const isTriggerHovered = ref(false);
const isTooltipHovered = ref(false);
let hideTimeout: NodeJS.Timeout | null = null;

const calculatePosition = async () => {
  if (!currentTriggerElementForPosition.value || !tooltipRef.value) {
    tooltipPosition.value = null;
    return;
  }

  await nextTick();

  const triggerRect = currentTriggerElementForPosition.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let newX = 0;
  let newY = 0;

  switch (props.position) {
    case "right":
      newX = triggerRect.right + props.offset;
      newY = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      if (
          newX + tooltipRect.width > viewportWidth &&
          triggerRect.left - tooltipRect.width - props.offset >= 0
      ) {
        newX = triggerRect.left - tooltipRect.width - props.offset;
      }
      break;
    case "left":
      newX = triggerRect.left - tooltipRect.width - props.offset;
      newY = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      if (
          newX < 0 &&
          triggerRect.right + tooltipRect.width + props.offset <= viewportWidth
      ) {
        newX = triggerRect.right + props.offset;
      }
      break;
    case "top":
      newX = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      newY = triggerRect.top - tooltipRect.height - props.offset;
      if (
          newY < 0 &&
          triggerRect.bottom + tooltipRect.height + props.offset <= viewportHeight
      ) {
        newY = triggerRect.bottom + props.offset;
      }
      break;
    case "bottom":
      newX = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      newY = triggerRect.bottom + props.offset;
      if (
          newY + tooltipRect.height > viewportHeight &&
          triggerRect.top - tooltipRect.height - props.offset >= 0
      ) {
        newY = triggerRect.top - tooltipRect.height - props.offset;
      }
      break;
  }

  newY = Math.max(0, Math.min(newY, viewportHeight - tooltipRect.height));
  newX = Math.max(0, Math.min(newX, viewportWidth - tooltipRect.width));

  tooltipPosition.value = { x: newX, y: newY };
};

const showTooltip = () => {
  if (props.isDisabled) {
    return;
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  if (props.isVisible === undefined) {
    internalIsVisible.value = true;
  }
  emit('update:isVisible', true);
  emit('visibilityChange', true);
};

const tryHideTooltip = () => {
  if (props.isDisabled && !props.alwaysVisible) {
    return;
  }

  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }

  hideTimeout = setTimeout(() => {
    if (!isTriggerHovered.value && !isTooltipHovered.value) {
      if (props.isVisible === undefined) {
        internalIsVisible.value = false;
        tooltipPosition.value = null; // Reset position when hidden
      }
      emit('update:isVisible', false);
      emit('visibilityChange', false);
    }
    hideTimeout = null;
  }, 200);
};

const handleTooltipMouseEnter = () => {
  isTooltipHovered.value = true;
  showTooltip();
};

const handleTooltipMouseLeave = () => {
  isTooltipHovered.value = false;
  tryHideTooltip();
};

watch(isVisible, (newValue) => {
  if (newValue) {
    requestAnimationFrame(() => {
      calculatePosition();
    });
  }
});

// Effect for handling trigger events
onMounted(() => {
  const setupTriggerEvents = (element: unknown) => {
    // Type guard to ensure we have an HTMLElement
    if (!(element && element instanceof HTMLElement)) {
      return;
    }

    const handleTriggerEnter = () => {
      isTriggerHovered.value = true;
      showTooltip();
    };

    const handleTriggerLeave = () => {
      isTriggerHovered.value = false;
      tryHideTooltip();
    };

    element.addEventListener("mouseenter", handleTriggerEnter);
    element.addEventListener("mouseleave", handleTriggerLeave);
    element.addEventListener("focus", handleTriggerEnter);
    element.addEventListener("blur", handleTriggerLeave);

    onBeforeUnmount(() => {
      element.removeEventListener("mouseenter", handleTriggerEnter);
      element.removeEventListener("mouseleave", handleTriggerLeave);
      element.removeEventListener("focus", handleTriggerEnter);
      element.removeEventListener("blur", handleTriggerLeave);
    });
  };

  watch(currentTriggerElementForPosition, (newElement) => {
    if (newElement) {
      setupTriggerEvents(newElement);
    }
  }, { immediate: true });
});
</script>

<template>
  <div v-if="!props.externalTriggerRef" ref="internalTriggerRef" class="inline-block" tabindex="0">
    <slot />
  </div>

  <ClientOnly>
    <Teleport to="body">
      <div
          v-if="isVisible"
          ref="tooltipRef"
          :class="[tooltipVariants({ colorScheme: props.colorScheme, size: props.size }), props.className]"
          :style="{
          top: tooltipPosition?.y != null ? `${tooltipPosition.y}px` : '0px',
          left: tooltipPosition?.x != null ? `${tooltipPosition.x}px` : '0px',
          opacity: tooltipPosition ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          visibility: isVisible ? 'visible' : 'hidden',
        }"
          role="tooltip"
          @mouseenter="handleTooltipMouseEnter"
          @mouseleave="handleTooltipMouseLeave"
      >
        <slot name="content" />
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
</style>

<style scoped>
</style>