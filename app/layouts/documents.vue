<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
</script>

<template>
  <UPage v-if="page">
    <template #left>
      <UPageAside>
        <template #top>
          <UContentSearchButton :collapsed="false" label="Search" />
        </template>
        <UContentNavigation
          :navigation="navigation"
          highlight
        />
      </UPageAside>
    </template>
    <UPageBody>
      <slot />
      <USeparator v-if="surround?.length" />
      <UContentSurround :surround="surround" />
    </UPageBody>
    <template v-if="page?.body?.toc?.links?.length" #right>
      <UContentToc title="Table of Contents" :links="page.body.toc.links" highlight />
    </template>
  </UPage>
</template>

<style scoped>

</style>