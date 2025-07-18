<script setup lang="ts">
import { ref, computed } from 'vue'
import LayoutBox from "~/components/basic/base/LayoutBox.vue";

interface ImageProps {
  src: string
  alt: string
  aspectRatio?: string
  containerClass?: string
  skeletonLoading?: boolean
  fallbackSrc?: string
  imageClass?: string
  fill?: boolean
  size?: string
}

const props = withDefaults(defineProps<ImageProps>(), {
  skeletonLoading: false,
  fill: false,
  aspectRatio: undefined,
  containerClass: undefined,
  fallbackSrc: undefined,
  imageClass: '',
  size: undefined,
})

const emit = defineEmits<{
  (e: 'error' | 'load', payload: Event | string): void
}>()

const isLoaded = ref(false)
const hasError = ref(false)

const handleImageLoad = (event: Event | string) => {
  isLoaded.value = true
  emit('load', event)
}

const handleError = (event: Event | string) => {
  hasError.value = true
  isLoaded.value = true
  emit('error', event)
}

const imageSrc = computed(() => hasError.value && props.fallbackSrc ? props.fallbackSrc : props.src)
const objectFitClass = computed(() => props.fill ? 'object-cover' : '')

const aspectRatioValue = computed(() => {
  if (!props.aspectRatio) return 'unset'; // Fallback for no aspect ratio
  return props.aspectRatio.replace(':', '/').replace(' ', '');
});

const unifiedContainerClasses = computed(() => {
  const classes = [];

  if (props.containerClass) {
    classes.push(props.containerClass);
  }

  // Apply aspect ratio only if size is not provided
  if (!props.size) {
    classes.push(`[--aspect-ratio:var(--fallback-aspect-ratio,${aspectRatioValue.value})]`);

    if (props.aspectRatio) {
      classes.push('relative', 'w-full', 'pt-[calc(100%/var(--aspect-ratio))]');
    }
  }

  if (props.skeletonLoading && !isLoaded.value) {
    classes.push('bg-gray-200', 'animate-pulse');
  }

  return classes;
});

const imageStyles = computed(() => {
  const styles: Record<string, string> = {};
  if (props.size) {
    styles.width = props.size;
    styles.height = props.size;
  }
  return styles;
});
</script>

<template>
  <LayoutBox
      :class="unifiedContainerClasses"
      :style="size ? imageStyles : undefined"
  >
    <slot v-if="hasError" name="error">
      <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <span class="text-gray-500">Failed to load image</span>
      </div>
    </slot>
    <NuxtImg
        v-else
        :src="imageSrc"
        :alt="alt"
        :draggable=true
        :class="[
        imageClass,
        objectFitClass,
        { 'absolute inset-0': aspectRatio && fill && !size } // Apply absolute positioning only if not sized by 'size' prop
      ]"
        :style="imageStyles"
        v-bind="$attrs"
        @load="handleImageLoad"
        @error="handleError"
    />
  </LayoutBox>
</template>