<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

interface DropdownPortalContentProps {
  /**
   * The DOM element to which the content should be ported.
   * This must be a resolved Element or DocumentFragment.
   */
  portalTarget: Element | DocumentFragment | string;
}

const props = defineProps<DropdownPortalContentProps>();

const resolvedTarget = ref<Element | DocumentFragment | null>(null);

onMounted(() => {
  resolvePortalTarget();
});

watch(
    () => props.portalTarget,
    () => {
      resolvePortalTarget();
    },
);

function resolvePortalTarget() {
  if (typeof props.portalTarget === 'string') {
    resolvedTarget.value = document.getElementById(props.portalTarget);
  } else {
    resolvedTarget.value = props.portalTarget;
  }
}
</script>

<template>
  <ClientOnly>
    <teleport v-if="resolvedTarget" :to="resolvedTarget">
      <slot />
    </teleport>
  </ClientOnly>
</template>