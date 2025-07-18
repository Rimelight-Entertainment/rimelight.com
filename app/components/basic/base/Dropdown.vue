<script lang="ts" setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
    
  
} from 'vue';
import type {Ref, CSSProperties} from 'vue';
import DropdownPortalContent from '~/components/basic/base/DropdownPortalContent.vue';

export interface TriggerRenderProps {
  triggerRef: Ref<HTMLElement | null>;
  toggle: () => void;
  open: () => void;
  close: () => void;
  isOpen: boolean;
  isClosing: boolean;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

export interface ContentRenderProps {
  contentRef: Ref<HTMLDivElement | null>;
  style: CSSProperties;
  isOpen: boolean;
  isClosing: boolean;
  onTransitionEnd: (event: TransitionEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  visibilityClass: string;
}

interface DropdownProps {
  openMode?: 'click' | 'hover';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  matchTriggerWidth?: boolean;
  animationDuration?: number;
  verticalOffset?: number;
  horizontalOffset?: number;
  /**
   * Optional. The DOM element to which the content should be ported.
   * If a string, it will be treated as an element ID to query.
   * Defaults to `document.body` if not provided or found.
   */
  portalTarget?: Element | DocumentFragment | string | null;
}

const props = withDefaults(defineProps<DropdownProps>(), {
  openMode: 'click',
  closeOnOutsideClick: true,
  closeOnEscape: true,
  matchTriggerWidth: false,
  animationDuration: 200,
  verticalOffset: 4,
  horizontalOffset: 0,
  portalTarget: null,
});

const isOpen = ref(false);
const isClosing = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const closeTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const suppressFocusTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const resolvedPortalTarget = ref<Element | DocumentFragment | null>(null);

// Resolve portal target similar to DropdownPortalContent
onMounted(() => {
  resolvePortalTargetValue();
});

watch(
    () => props.portalTarget,
    () => {
      resolvePortalTargetValue();
    },
);

function resolvePortalTargetValue() {
  let target: Element | DocumentFragment | null;
  if (typeof props.portalTarget === 'string') {
    target = document.getElementById(props.portalTarget);
  } else if (props.portalTarget) {
    target = props.portalTarget;
  } else {
    target = document.body;
  }
  resolvedPortalTarget.value = target;
}

const menuPosition = ref({
  x: 0,
  y: 0,
  width: 0,
  positionAbove: false,
});

const calculatePosition = async () => {
  await nextTick();

  if (!triggerRef.value || !contentRef.value) {
    return;
  }

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const contentRect = contentRef.value.getBoundingClientRect();

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let top = triggerRect.bottom + props.verticalOffset;
  let left = triggerRect.left + props.horizontalOffset;
  let positionAbove = false;

  if (top + contentRect.height > viewportHeight && triggerRect.top - contentRect.height - props.verticalOffset >= 0) {
    top = triggerRect.top - contentRect.height - props.verticalOffset;
    positionAbove = true;
  }

  if (top < 0 && positionAbove) {
    top = 0;
  } else if (top < 0 && !positionAbove) {
    top = triggerRect.bottom + props.verticalOffset;
    if (top < 0) top = 0;
  }


  if (left + contentRect.width > viewportWidth) {
    left = viewportWidth - contentRect.width - props.horizontalOffset;
  }
  if (left < 0) {
    left = 0;
  }

  menuPosition.value = {
    x: left,
    y: top,
    width: props.matchTriggerWidth ? triggerRect.width : contentRect.width,
    positionAbove,
  };
};

const closeMenu = () => {
  if (isOpen.value) {
    isClosing.value = true;
    if (closeTimeout.value) {
      clearTimeout(closeTimeout.value);
    }
    closeTimeout.value = setTimeout(() => {
      isOpen.value = false;
      isClosing.value = false;
      closeTimeout.value = null;
    }, props.animationDuration);
  }
};

const openMenu = () => {
  if (closeTimeout.value) {
    clearTimeout(closeTimeout.value);
    closeTimeout.value = null;
  }
  if (!isOpen.value) {
    isOpen.value = true;
    isClosing.value = false;
    // Calculate position immediately when opening
    nextTick(calculatePosition);
  }
};

const toggleMenu = () => {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};

const handleOutsideClick = (event: MouseEvent) => {
  if (
      props.closeOnOutsideClick &&
      isOpen.value &&
      triggerRef.value &&
      !triggerRef.value.contains(event.target as Node) &&
      contentRef.value &&
      !contentRef.value.contains(event.target as Node) &&
      suppressFocusTimeout.value === null
  ) {
    closeMenu();
  }
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (props.closeOnEscape && event.key === 'Escape' && isOpen.value) {
    closeMenu();
  }
};

const handleTransitionEnd = (event: TransitionEvent) => {
  if (!isOpen.value && isClosing.value && event.propertyName === 'opacity') {
    isClosing.value = false;
  }
};

const handleTriggerClick = (event: MouseEvent) => {
  event.stopPropagation(); // Prevent immediate outside click detection
  if (suppressFocusTimeout.value) {
    clearTimeout(suppressFocusTimeout.value);
    suppressFocusTimeout.value = null;
  }
  toggleMenu();
};

const handleContentMouseLeave = () => {
  if (props.openMode === 'hover') {
    closeMenu();
  }
};

const handleTriggerMouseEnter = () => {
  if (props.openMode === 'hover') {
    openMenu();
  }
};

const handleTriggerMouseLeave = () => {
  if (props.openMode === 'hover') {
    // Add a small delay to allow moving mouse to content without closing immediately
    if (suppressFocusTimeout.value) {
      clearTimeout(suppressFocusTimeout.value);
    }
    suppressFocusTimeout.value = setTimeout(() => {
      // Check again if the menu is still open and not hovered
      if (
          isOpen.value &&
          triggerRef.value &&
          !triggerRef.value.matches(':hover') && // Use matches(':hover') for a robust check
          contentRef.value &&
          !contentRef.value.matches(':hover')
      ) {
        closeMenu();
      }
      suppressFocusTimeout.value = null;
    }, 50); // Small delay
  }
};

// Watch for isOpen state to add/remove event listeners and reposition
watch(
    [isOpen, isClosing],
    ([newIsOpen, newIsClosing], [oldIsOpen, oldIsClosing]) => {
      if (newIsOpen && !newIsClosing && (!oldIsOpen || oldIsClosing)) {
        nextTick(() => {
          calculatePosition();
          window.addEventListener('resize', calculatePosition);
          window.addEventListener('scroll', calculatePosition, true);
          document.addEventListener('mousedown', handleOutsideClick);
          document.addEventListener('keydown', handleEscapeKey);
        });
      }
      else if (!newIsOpen && !newIsClosing && (oldIsOpen || oldIsClosing)) {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscapeKey);
      }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculatePosition);
  window.removeEventListener('scroll', calculatePosition, true);
  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('keydown', handleEscapeKey);

  if (closeTimeout.value) {
    clearTimeout(closeTimeout.value);
  }
  if (suppressFocusTimeout.value) {
    clearTimeout(suppressFocusTimeout.value);
  }
});

const contentStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: `${menuPosition.value.y}px`,
  left: `${menuPosition.value.x}px`,
  width: props.matchTriggerWidth ? `${menuPosition.value.width}px` : undefined,
  transformOrigin: menuPosition.value.positionAbove
      ? 'bottom center'
      : 'top center',
  zIndex: 9999999,
  transition: `opacity ${props.animationDuration}ms ease-out, transform ${props.animationDuration}ms ease-out`,
}));

const visibilityClass = computed(() =>
    isOpen.value && !isClosing.value
        ? 'opacity-100 scale-100 pointer-events-auto'
        : 'opacity-0 scale-90 pointer-events-none',
);
</script>

<template>
  <div>
    <slot
        name="trigger"
        :trigger-ref="triggerRef"
        :toggle="toggleMenu"
        :open="openMenu"
        :close="closeMenu"
        :is-open="isOpen"
        :is-closing="isClosing"
        :on-click="props.openMode === 'click' ? handleTriggerClick : undefined"
        :on-mouse-enter="props.openMode === 'hover' ? handleTriggerMouseEnter : undefined"
        :on-mouse-leave="props.openMode === 'hover' ? handleTriggerMouseLeave : undefined"
    />

    <template v-if="(isOpen || isClosing) && resolvedPortalTarget">
      <DropdownPortalContent :portal-target="resolvedPortalTarget">
        <slot
            name="content"
            :content-ref="contentRef"
            :style="contentStyle"
            :is-open="isOpen"
            :is-closing="isClosing"
            :on-transition-end="handleTransitionEnd"
            :on-mouse-leave="props.openMode === 'hover' ? handleContentMouseLeave : undefined"
            :visibility-class="visibilityClass"
        />
      </DropdownPortalContent>
    </template>
  </div>
</template>