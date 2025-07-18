<script setup lang="ts">
import { computed, useAttrs, getCurrentInstance } from 'vue';
import { getIconComponent, iconMap } from '~/types/Icons';
import type { IconComponent, IconName } from '~/types/Icons';
import type { Sizes } from '~/config/article';

/**
 * Defines the size categories for icons, ensuring consistency across the application.
 */
const iconSizes = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
  none: "",
} as const;

export type IconSize = Sizes;

interface IconProps {
  /**
   * The name of the icon to display, corresponding to a key in `iconMap`.
   */
  name: IconName;
  /**
   * Provides an accessible title for the icon, read by screen readers.
   */
  title?: string;
  /**
   * Provides a more detailed description for the icon, read by screen readers.
   */
  description?: string;
  /**
   * Explicitly sets the `aria-hidden` attribute.
   * If `title` or `description` are provided, this prop will be overridden to `false`
   * unless `true` is explicitly passed, in which case the icon is hidden.
   */
  ariaHidden?: boolean;
  /**
   * Defines the size of the icon using predefined categories.
   */
  size?: IconSize;
  /**
   * Additional CSS classes to apply to the icon's SVG element.
   */
  class?: string | Record<string, boolean> | (string | Record<string, boolean>)[];
  /**
   * Optional click handler for the icon.
   */
  onClick?: (event: MouseEvent) => void;
}

const props = withDefaults(defineProps<IconProps>(), {
  size: 'md',
  ariaHidden: undefined,
  title: undefined,
  description: undefined,
  class: '',
  onClick: undefined,
});

const attrs = useAttrs();
const instance = getCurrentInstance();
const uid = computed(() => `icon-${instance?.uid}`);

const titleId = computed(() => props.title ? `${uid.value}-title` : undefined);
const descId = computed(() => props.description ? `${uid.value}-desc` : undefined);

const labelledBy = computed(() => {
  const ids: string[] = [];
  if (titleId.value) {
    ids.push(titleId.value);
  }
  if (descId.value) {
    ids.push(descId.value);
  }
  return ids.join(' ') || undefined;
});

const hasAccessibleLabel = computed(() => !!props.title || !!props.description);

const finalAriaHidden = computed(() => {
  if (props.ariaHidden) {
    return true;
  }
  return !hasAccessibleLabel.value;
});

const role = computed(() => hasAccessibleLabel.value && !finalAriaHidden.value ? 'img' : undefined);

const iconClasses = computed(() => {
  const sizeClass = iconSizes[props.size];
  return `flex-shrink-0 fill-current ${sizeClass} ${props.class}`;
});

const SvgComponent = computed<IconComponent>(() => {
  return getIconComponent(props.name) || iconMap.default;
});
</script>

<template>
  <component
      :is="SvgComponent"
      :class="iconClasses"
      :role="role"
      :aria-labelledby="labelledBy"
      :aria-hidden="finalAriaHidden"
      v-bind="attrs"
  />
</template>

<style scoped>

</style>