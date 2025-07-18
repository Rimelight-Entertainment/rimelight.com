<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cva } from 'class-variance-authority';
import Tooltip from '~/components/basic/base/Tooltip.vue';
import Icon from '~/components/basic/base/Icon.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';

const labelVariants = cva(
    "flex items-center gap-sm text-sm font-semibold text-rimelight-primary-100",
    {
      variants: {},
      defaultVariants: {},
    },
);

interface LabelProps {
  /**
   * The text of the label.
   */
  text: string;
  /**
   * Optional text for a tooltip that appears on hover.
   */
  tooltip?: string;
  /**
   * If true, an asterisk (*) is appended to the label to indicate a required field.
   * Defaults to false.
   */
  required?: boolean;
  /**
   * Optional class names to apply to the label element.
   * This is automatically merged by CVA and Vue's class binding.
   */
  class?: string;
}

const props = withDefaults(defineProps<LabelProps>(), {
  required: false,
  tooltip: undefined,
  class: undefined,
});

const attrs = computed(() => {
  const allAttrs = useAttrs();
  const { required, tooltip, class: className, ...restAttrs } = props;
  return { ...allAttrs, ...restAttrs };
});

const computedClassName = computed(() => labelVariants({ className: props.class }));
</script>

<template>
  <label :class="computedClassName" v-bind="attrs">
    <LayoutBox direction="horizontal" align-items="center" gap="sm">
      {{ props.text }}
      <span v-if="props.required" class="text-rimelight-danger-500" aria-hidden="true">
        *
      </span>
      <template v-if="props.tooltip">
        <Tooltip position="right">
          <Icon name="tooltip" size="xs" />
          <template #content>
            {{ props.tooltip }}
          </template>
        </Tooltip>
      </template>
    </LayoutBox>
  </label>
</template>

<style scoped>
</style>