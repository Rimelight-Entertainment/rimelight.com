<script setup lang="ts">

</script>

<template>
  <RLLayoutBox
      tag="footer"
      class="bg-primary-900 p-xl shadow-[0_-4px_0_0_#000]"
  >
    <NuxtLink to="/branding">Branding</NuxtLink>

    <h6>Documents</h6>
    <NuxtLink to="/documents/terms-of-service">Terms of Service</NuxtLink>
    <NuxtLink to="/documents/privacy-policy">Privacy Policy</NuxtLink>
    <NuxtLink to="/documents/cookie-policy">Cookie Policy</NuxtLink>
    <NuxtLink to="/documents/code-of-conduct">Code of Conduct</NuxtLink>
    <NuxtLink to="/documents/other-documents">Other Documents</NuxtLink>
    <span class="text-sm text-white">
      &copy; {{ new Date().getFullYear() }} Queer Kit. All rights reserved.
    </span>
  </RLLayoutBox>
</template>

<style scoped>

</style>