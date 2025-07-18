<script lang="ts" setup>
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { NuxtLinkProps } from '#app';
import type { IconName } from '~/types/Icons';
import type { Sizes } from '~/config/article';
import type { IconSize } from '~/components/basic/base/Icon.vue';
import Icon from "~/components/basic/base/Icon.vue";
import { computed, useAttrs} from 'vue';
import { NuxtLink } from "#components";
import LayoutBox from "~/components/basic/base/LayoutBox.vue";

type ButtonIconSize = IconSize;

const buttonVariants = cva(
    'flex relative transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    {
      variants: {
        variant: {
          primary:
              'text-rimelight-primary-100 border border-rimelight-primary-200 bg-rimelight-primary-500 hover:bg-rimelight-primary-600 active:bg-rimelight-primary-700 focus-visible:ring-rimelight-primary-500',
          ghost:
              'text-rimelight-primary-100 bg-transparent border border-transparent hover:bg-rimelight-primary-600 hover:border-rimelight-primary-500 active:bg-rimelight-primary-700 focus-visible:ring-rimelight-primary-500',
          link: 'text-rimelight-primary-500 border border-transparent hover:underline focus-visible:ring-rimelight-500',
          danger:
              'text-rimelight-danger-100 border border-rimelight-danger-200 bg-rimelight-danger-500 hover:bg-rimelight-danger-600 active:bg-rimelight-danger-700 focus-visible:ring-rimelight-danger-500',
        },
        size: {
          xs: 'text-xs',
          sm: 'text-sm',
          md: 'text-base',
          lg: 'text-lg',
          xl: 'text-xl',
        },
        alignItems: {
          start: "items-start",
          end: "items-end",
          center: "items-center",
          baseline: "items-baseline",
          stretch: "items-stretch",
        },
        fullWidth: {
          true: 'w-full',
        },
        isDisabled: {
          true: 'opacity-50 cursor-not-allowed',
        },
        hasIconOnly: {
          true: '',
          false: '',
        }
      },
      defaultVariants: {
        variant: 'primary',
        size: 'md',
        alignItems: 'center',
        fullWidth: false,
        isDisabled: false,
        hasIconOnly: false,
      },
      compoundVariants: [
        { size: 'xs', hasIconOnly: false, class: 'px-2 py-1' },
        { size: 'sm', hasIconOnly: false, class: 'px-3 py-1.5' },
        { size: 'md', hasIconOnly: false, class: 'px-4 py-2' },
        { size: 'lg', hasIconOnly: false, class: 'px-5 py-3' },
        { size: 'xl', hasIconOnly: false, class: 'px-6 py-4' },

        { size: 'xs', hasIconOnly: true, class: 'p-xs' },
        { size: 'sm', hasIconOnly: true, class: 'p-sm' },
        { size: 'md', hasIconOnly: true, class: 'p-md' },
        { size: 'lg', hasIconOnly: true, class: 'p-lg' },
        { size: 'xl', hasIconOnly: true, class: 'p-xl' },
      ]
    },
);

type ButtonAlignItems = VariantProps<typeof buttonVariants>['alignItems'];

interface CommonButtonProps {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: Sizes;
  alignItems?: ButtonAlignItems;
  fullWidth?: VariantProps<typeof buttonVariants>['fullWidth'];
  isDisabled?: VariantProps<typeof buttonVariants>['isDisabled'];
  startIcon?: IconName;
  text?: string;
  endIcon?: IconName;
  isLoading?: boolean;
  /**
   * Props to pass directly to the Icon component, including size and additional class names.
   */
  iconProps?: {
    className?: string;
    size?: ButtonIconSize;
  };
  className?: string;
}

// Props specific to native HTML buttons
interface NativeButtonProps extends CommonButtonProps {
  type?: 'submit' | 'button' | 'reset';
  href?: never; // Ensures href is not present for native buttons
}

// Props specific to NuxtLink buttons
interface LinkButtonProps extends CommonButtonProps {
  href?: string; // Changed from string | UrlObject to just string
  replace?: NuxtLinkProps['replace'];
  external?: NuxtLinkProps['external'];
  target?: NuxtLinkProps['target'];
  rel?: NuxtLinkProps['rel'];
  noPrefetch?: NuxtLinkProps['noPrefetch'];
  prefetch?: NuxtLinkProps['prefetch'];
  activeClass?: NuxtLinkProps['activeClass'];
  exactActiveClass?: NuxtLinkProps['exactActiveClass'];
  'ariaCurrent'?: 'entry' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
}

// Union type for all possible button props
type ButtonProps = NativeButtonProps | LinkButtonProps;

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  alignItems: 'center',
  fullWidth: false,
  isDisabled: false,
  isLoading: false,
  iconProps: () => ({}),
  replace: undefined,
  external: undefined,
  target: undefined,
  rel: undefined,
  noPrefetch: undefined,
  prefetch: undefined,
  activeClass: undefined,
  exactActiveClass: undefined,
  ariaCurrent: undefined,
  type: undefined,
  href: ''
});

// Get the attributes passed to the component that are not declared as props
const attrs = useAttrs();

// MODIFIED: hasContent now checks for text AND if there's any icon
const hasContent = computed(() => !!props.text);
const hasAnyIcon = computed(() => !!props.startIcon || !!props.endIcon);
const isDisabled = computed(() => props.isDisabled || props.isLoading);

// Determine if it's a link or a button
const isLink = computed(() => !!props.href);

// Determine the actual component to render (NuxtLink, button, or span for disabled links)
const componentTag = computed(() => {
  if (isLink.value) {
    // Disabled links should render as a span to prevent navigation and maintain accessibility semantics.
    return isDisabled.value ? 'span' : NuxtLink;
  }
  return 'button';
});

// Calculate the CVA size based on the component's size prop
const cvaSize: VariantProps<typeof buttonVariants>['size'] =
    props.size === 'none' ? undefined : props.size;

// Calculate the default icon size based on the component's size prop
const defaultIconSize: ButtonIconSize =
    props.size === 'none' ? 'md' : (props.size as ButtonIconSize);

const baseClasses = computed(() => [
  buttonVariants({
    variant: props.variant,
    size: cvaSize,
    alignItems: props.alignItems,
    fullWidth: props.fullWidth,
    isDisabled: isDisabled.value,
    // NEW: Pass hasIconOnly to CVA
    hasIconOnly: !hasContent.value && hasAnyIcon.value,
  }),
  props.className,
  isLink.value && isDisabled.value && 'no-underline',
].filter(Boolean));

// Define custom events
const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

// Compute all attributes to be bound to the root element
const combinedAttrs = computed(() => {
  const componentAttrs: Record<string, unknown> = {
    ...dataAttributes.value,
    // Add aria-disabled for semantic disabled state, especially for links
    'aria-disabled': isDisabled.value ? true : undefined,
  };

  // Handle click event for both buttons and links
  componentAttrs.onClick = (event: MouseEvent) => {
    if (!isDisabled.value) {
      emit('click', event);
    } else {
      // Prevent default for disabled links/buttons if they are still clickable by some means
      event.preventDefault();
    }
  };

  if (isLink.value) {
    const linkProps = props as LinkButtonProps;

    if (!isDisabled.value) {
      // Directly use linkProps.href as the 'to' prop for NuxtLink
      if (linkProps.href !== undefined) {
        componentAttrs.to = linkProps.href;
      }

      componentAttrs.replace = linkProps.replace;
      componentAttrs.external = linkProps.external;
      componentAttrs.target = linkProps.target;
      componentAttrs.rel = linkProps.rel;
      componentAttrs.noPrefetch = linkProps.noPrefetch;
      componentAttrs.prefetch = linkProps.prefetch;
      componentAttrs.activeClass = linkProps.activeClass;
      componentAttrs.exactActiveClass = linkProps.exactActiveClass;
    }
    // aria-current is an HTML attribute, so it's always set regardless of the disabled state
    if (linkProps['ariaCurrent']) {
      componentAttrs['ariaCurrent'] = linkProps['ariaCurrent'];
    }

    // For disabled links, ensure navigation-related attributes are removed
    if (isDisabled.value) {
      delete componentAttrs.to;
      // tabindex should be -1 for disabled interactive elements
      componentAttrs.tabindex = -1;
    }
  } else {
    // Native button-specific props
    const nativeProps = props as NativeButtonProps; // Type assertion for TypeScript
    componentAttrs.type = nativeProps.type || 'button';
    componentAttrs.disabled = isDisabled.value; // HTML disabled attribute for native buttons
  }

  // Merge with inherited attributes (`useAttrs`)
  return {...componentAttrs, ...attrs};
});

// Data attributes for styling or debugging
const dataAttributes = computed(() => ({
  'data-variant': props.variant,
  'data-full-width': props.fullWidth ? 'true' : undefined,
  'data-size': props.size,
}));
</script>

<template>
  <component
      :is="componentTag"
      :class="baseClasses"
      v-bind="combinedAttrs"
      :role="isLink && isDisabled ? 'link' : undefined"
      :aria-label="isLoading ? 'Loading' : undefined"
  >
    <template v-if="isLoading">
      <LayoutBox align-items="center" justify-content="center">
        <span class="h-5 w-5 animate-spin rounded-full border-b-2 border-current" aria-hidden="true"/>
        <span v-if="text" class="ml-2">{{ text }}</span>
        <span class="sr-only" aria-live="polite">Loading...</span>
      </LayoutBox>
    </template>
    <template v-else>
      <Icon
          v-if="startIcon"
          :name="startIcon"
          :size="props.iconProps?.size ?? defaultIconSize"
          :class="[
            { 'mr-2': hasContent },
            props.iconProps?.className,
          ]"
          :aria-hidden="true"
      />
      <span v-if="text">{{ text }}</span>
      <Icon
          v-if="endIcon"
          :name="endIcon"
          :size="props.iconProps?.size ?? defaultIconSize"
          :class="[
            { 'ml-2': hasContent },
            props.iconProps?.className,
          ]"
          :aria-hidden="true"
      />
    </template>
  </component>
</template>