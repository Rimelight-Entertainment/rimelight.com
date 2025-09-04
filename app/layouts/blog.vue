<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryCollection('blog').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('blog', route.path, {
    fields: ['description']
  })
})

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})
</script>

<template>
  <UPage v-if="page">
    <template #left>
      <UPageAside>
        <template #top>
          <UContentSearchButton :collapsed="false" />
        </template>
        <UContentNavigation
          :navigation="navigation"
          highlight
        />
      </UPageAside>
    </template>
    <UPageHeader
      :title="page.title"
      :description="page.description"
      :headline="page.type"
      :links="page.links"
    />
    <UPageBody>
      <ContentRenderer v-if="page.body" :value="page" />
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