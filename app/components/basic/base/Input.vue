<script setup lang="ts">
import { ref, computed, useAttrs  } from 'vue';
import type {ComputedRef} from 'vue';
import { cva  } from 'class-variance-authority';
import type {VariantProps} from 'class-variance-authority';
import Icon from '~/components/basic/base/Icon.vue';
import type { IconName } from '~/types/Icons';
import type { Sizes } from '~/config/article';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import Label from '~/components/basic/base/Label.vue';

/**
 * Defines the possible states for the Input component.
 */
type InputState = 'default' | 'error' | 'success';

type InputType =
    | 'number'
    | 'text'
    | 'description'
    | 'search'
    | 'email'
    | 'password'
    | 'date'
    | 'phone'
    | 'address'
    | 'zip'
    | 'card'
    | 'file';

const inputVariants = cva(
    // Base styles applied to all input types
    "w-full rounded-none bg-rimelight-primary-800 text-rimelight-primary-100 placeholder-rimelight-primary-500 outline-none focus:ring-2 focus:ring-offset-0 rounded-md transition-colors duration-200",
    {
      variants: {
        size: {
          xs: "py-1 px-2 text-xs",
          sm: "py-1.5 px-3 text-sm",
          md: "py-2 px-4 text-md",
          lg: "py-3 px-5 text-lg",
          xl: "py-4 px-6 text-xl",
          none: "p-0",
        },
        state: {
          default:
              "border border-rimelight-primary-500 focus:ring-rimelight-primary-500",
          error: "border border-rimelight-error-500 focus:ring-rimelight-error-500",
          success: "border border-rimelight-success focus:ring-rimelight-success",
        },
        hasStartIcon: {
          true: "pl-8",
        },
        hasEndIcon: {
          true: "pr-8",
        },
      },
      defaultVariants: {
        size: "sm",
        state: "default",
        hasStartIcon: false,
        hasEndIcon: false,
      },
    },
);

interface Props extends /* @vue-ignore */ VariantProps<typeof inputVariants> {
  /**
   * Defines the type of the input field.
   */
  type?: InputType;
  /**
   * Defines the size of the input and its internal icon.
   */
  size?: Sizes;
  /**
   * Optional label to display above of the input.
   */
  label?: string;
  /**
   * Optional label tooltip to display.
   */
  labelTooltip?: string;
  /**
   * If true, an asterisk (*) is appended to the label to indicate a required field.
   * Defaults to false.
   */
  required?: boolean;
  /**
   * Optional text to be displayed below the input field when in the default state.
   */
  hint?: string;
  /**
   * Optional text to be displayed below the input field when in the error state.
   * This takes precedence over `hint` when `state` is 'error'.
   */
  errorMessage?: string;
  /**
   * Optional text to be displayed below the input field when in success state.
   * This takes precedence over `hint` when `state` is 'success'.
   */
  successMessage?: string;
  /**
   * Optional icon to display at the start of the input.
   */
  startIcon?: IconName;
  /**
   * Optional icon to display at the end of the input.
   */
  endIcon?: IconName;
  /**
   * The field's placeholder text.
   */
  placeholder?: string;
  /**
   * Defines the visual state of the input (e.g., 'error', 'success').
   * Defaults to 'default'.
   */
  state?: InputState;
  /**
   * Class name passed through from the parent. This will be applied to the root LayoutBox.
   */
  class?: string;
  /**
   * For file input: accepted file types.
   */
  accept?: string;
  /**
   * For file input: change event handler.
   */
  onChange?: (event: Event) => void;
  /**
   * The current value of the input for the v-model.
   */
  modelValue?: string | number | null;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'sm',
  label: undefined,
  labelTooltip: undefined,
  required: false,
  hint: undefined,
  errorMessage: undefined,
  successMessage: undefined,
  startIcon: undefined,
  endIcon: undefined,
  placeholder: undefined,
  state: 'default',
  class: undefined,
  accept: undefined,
  onChange: undefined,
  modelValue: undefined,
});

const attrs = useAttrs();

const showPassword = ref(false);

const inputRef = ref<HTMLInputElement | null>(null);

const isPasswordField: ComputedRef<boolean> = computed(() => props.type === 'password');
const isFileInput: ComputedRef<boolean> = computed(() => props.type === 'file');

const currentInputType: ComputedRef<InputType | 'text'> = computed(() =>
    isPasswordField.value && showPassword.value ? 'text' : props.type,
);

const effectiveEndIcon: ComputedRef<IconName | undefined> = computed(() => {
  if (isPasswordField.value) {
    return showPassword.value ? 'eye-off' : 'eye';
  }
  return props.endIcon;
});

const handleEndIconClick: ComputedRef<(() => void) | undefined> = computed(() => {
  if (isPasswordField.value) {
    return () => {
      showPassword.value = !showPassword.value;
    };
  }
  return undefined;
});

const effectiveHint: ComputedRef<string | undefined> = computed(() => {
  if (props.state === 'error' && props.errorMessage) {
    return props.errorMessage;
  }
  if (props.state === 'success' && props.successMessage) {
    return props.successMessage;
  }
  return props.hint;
});

const hintIcon: ComputedRef<IconName | undefined> = computed(() => {
  if (props.state === 'error') {
    return 'status.error';
  }
  if (props.state === 'success') {
    return 'status.success';
  }
  if (effectiveHint.value && props.state === 'default') {
    return 'status.hint';
  }
  return undefined;
});

const hintTextColorClass: ComputedRef<string> = computed(() => {
  if (props.state === 'error') {
    return 'text-rimelight-error-200';
  }
  if (props.state === 'success') {
    return 'text-rimelight-success';
  }
  return 'text-rimelight-primary-500';
});

const computedInputClass: ComputedRef<string> = computed(() =>
    inputVariants({
      size: props.size,
      state: props.state,
      hasStartIcon: !!props.startIcon,
      hasEndIcon: !!effectiveEndIcon.value || isPasswordField.value,
    }),
);

const fileInputClasses = computed(() => [
  'text-rimelight-primary-300',
  'mb-4',
  'block',
  'w-full',
  'text-sm',
  'file:bg-rimelight-primary-700',
  'file:text-rimelight-primary-100',
  'hover:file:bg-rimelight-primary-600',
  'file:mr-4',
  'file:rounded-full',
  'file:border-0',
  'file:px-4',
  'file:py-2',
  'file:text-sm',
  'file:font-semibold',
]);

const emit = defineEmits(['update:modelValue', 'change']);

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};

const handleChange = (event: Event) => {
  if (isFileInput.value && props.onChange) {
    props.onChange(event);
  }
  emit('change', event);
};
</script>

<template>
  <LayoutBox direction="vertical" gap="md" :class="props.class">
    <Label
        v-if="props.label"
        :text="props.label"
        :tooltip="props.labelTooltip"
        :required="props.required"
    />

    <template v-if="isFileInput">
      <input
          ref="inputRef"
          type="file"
          :accept="props.accept"
          :class="[
      computedInputClass,
      ...fileInputClasses
    ]"
          v-bind="attrs"
          @change="handleChange"
      >
    </template>

    <template v-else>
      <LayoutBox direction="horizontal" align-items="center" class="relative">
        <Icon
            v-if="props.startIcon"
            :name="props.startIcon"
            :size="props.size"
            class="absolute left-2 -translate-y-1/2 top-1/2"
        />

        <input
            ref="inputRef"
            :type="currentInputType"
            :placeholder="props.placeholder"
            :class="computedInputClass"
            :value="props.modelValue"
            v-bind="attrs"
            @input="handleInput"
            @change="handleChange"
        >

        <Icon
            v-if="effectiveEndIcon || isPasswordField"
            :name="effectiveEndIcon || 'eye'"
            :class="[
      'absolute right-2 -translate-y-1/2 top-1/2',
      isPasswordField ? 'cursor-pointer' : '',
    ]"
            :size="props.size"
            :on-click="handleEndIconClick"
        />
      </LayoutBox>
    </template>

    <LayoutBox
        v-if="effectiveHint"
        direction="horizontal"
        gap="xs"
        align-items="center"
    >
      <Icon
          v-if="hintIcon"
          :name="hintIcon"
          size="xs"
          :class="hintTextColorClass"
      />
      <span :class="hintTextColorClass">{{ effectiveHint }}</span>
    </LayoutBox>
  </LayoutBox>
</template>