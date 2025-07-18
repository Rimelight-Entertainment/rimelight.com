<script setup lang="ts">
import { NuxtLink } from '#components'; // Make sure NuxtLink is imported for internal links

// You might define your footer links here in the future
// or fetch them from a CMS. For now, they're hardcoded.
const footerNavLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
];

const socialLinks = [
  { name: 'Facebook', iconClass: 'i-mdi-facebook', href: 'https://facebook.com', ariaLabel: 'Follow us on Facebook' },
  { name: 'X (Twitter)', iconClass: 'i-mdi-twitter', href: 'https://twitter.com', ariaLabel: 'Follow us on X (Twitter)' },
  { name: 'Instagram', iconClass: 'i-mdi-instagram', href: 'https://instagram.com', ariaLabel: 'Follow us on Instagram' },
  { name: 'LinkedIn', iconClass: 'i-mdi-linkedin', href: 'https://linkedin.com', ariaLabel: 'Connect with us on LinkedIn' },
];
</script>

<template>
  <footer class="bg-rimelight-primary-900 text-rimelight-neutral-50 py-lg">
    <div class="container mx-auto px-md flex flex-col items-center text-center gap-lg">

      <nav aria-label="Footer navigation" class="w-full">
        <ul class="flex flex-wrap justify-center gap-x-lg gap-y-md text-md">
          <li v-for="link in footerNavLinks" :key="link.label">
            <NuxtLink
                :to="link.to"
                class="hover:text-rimelight-primary-200 transition-colors duration-200"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="flex gap-md">
        <a
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="social.ariaLabel"
            class="text-rimelight-neutral-50 hover:text-rimelight-primary-200 transition-colors duration-200 text-2xl"
        >
          <span :class="social.iconClass"/>
        </a>
      </div>

      <div class="text-sm text-rimelight-neutral-300">
        &copy; {{ new Date().getFullYear() }} Rimelight Entertainment. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<style scoped>

</style>