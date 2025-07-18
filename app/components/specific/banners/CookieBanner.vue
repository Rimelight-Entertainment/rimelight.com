<script lang="ts" setup>
import { ref } from 'vue';
import Button from '~/components/basic/base/Button.vue';
import LayoutBox from "~/components/basic/base/LayoutBox.vue";

const COOKIE_BANNER_CLOSED_KEY = 'cookieBannerClosed';

const showBanner = ref<boolean | null>(null);

onMounted(() => {
  const bannerClosedInSession = sessionStorage.getItem(COOKIE_BANNER_CLOSED_KEY) === 'true';
  showBanner.value = !bannerClosedInSession;
});

const hideBanner = () => {
  showBanner.value = false;
  if (import.meta.client) {
    sessionStorage.setItem(COOKIE_BANNER_CLOSED_KEY, 'true');
  }
};
</script>

<template>
  <LayoutBox
      v-if="showBanner"
      tag="dialog"
      position="fixed"
      padding="lg"
      align-items="center"
      justify-content="center"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie Consent"
      class="w-full bottom-0 z-50 bg-rimelight-primary-600 text-rimelight-primary-100"
  >
    <LayoutBox
        direction="horizontal"
        gap="md"
        align-items="center"
        justify-content="between"
        class="max-w-[1440px] w-full" >
      <span class="text-sm text-center">
        We use cookies to ensure you get the best experience on our website. By continuing to use our site, you agree to our
        <a href="/company/cookie-policy" class="underline" aria-label="Read our Privacy Policy">Cookie Policy</a>.
      </span>
      <LayoutBox direction="horizontal" gap="md">
        <Button variant="primary" text="Accept All" aria-label="Accept All Cookies" @click="hideBanner" />
        <Button variant="primary" text="Reject All" aria-label="Reject All Cookies" @click="hideBanner" />
      </LayoutBox>
    </LayoutBox>
  </LayoutBox>
</template>

<style scoped>

</style>