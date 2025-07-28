<script setup lang="ts">
import { useHead, useRoute } from '#app';
import { computed } from 'vue';
import Header from "../components/specific/navigation/Header.vue";
import Footer from "../components/specific/navigation/Footer.vue";

const route = useRoute();

const locale = computed(() => {
  const currentLocale = route.params.locale as string;
  return currentLocale || 'en';
});

const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));

useHead({
  htmlAttrs: {
    lang: locale,
    dir: dir,
  },
});
</script>

<template>
  <div :class="`bg-[#070f22] bg-[url('/page-background.webp')] bg-[size:100%_auto] bg-top bg-no-repeat`">
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
    <RLCookieBanner cookie-policy-link="/documents/cookie-policy" />
  </div>
</template>

<style scoped>

</style>