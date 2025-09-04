<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'
import { ar, en, es, fr, ja, ko, pt, ro, zh_cn } from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { FooterColumn } from '@nuxt/ui'
import RLLayoutBox from "~/components/temp/RLLayoutBox.vue";
import { useCookie } from "#app";
import { ref } from "vue";
import { ULink } from "#components";
import UnderConstruction from "~/components/temp/UnderConstruction.vue";

const isUnlocked = useState('siteUnlocked', () => false);

const { locale, setLocale } = useI18n()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

const toast = useToast()

const COOKIE_BANNER_CLOSED_KEY = 'cookieBannerClosed'

const cookieBannerConsent = useCookie<boolean>(COOKIE_BANNER_CLOSED_KEY, {
  default: () => false,
  maxAge: 60 * 60 * 24 * 90,
  secure: import.meta.env.PROD,
  sameSite: 'lax',
})

const descriptionComponent = h('div', [
  'This website uses ',
  h(ULink, { href: 'https://en.wikipedia.org/wiki/HTTP_cookie', target: '_blank' }, 'cookies'),
  ' to ensure to enhance your browsing experience. By continuing to use our site, you agree to our ',
  h(ULink, { href: '/documents/policies/cookie-policy/' }, 'Cookie Policy'),
  '.',
]);

function showCookieToast() {
  toast.add({
    duration: 0,
    color: 'primary',
    icon: 'lucide:cookie',
    title: 'Cookie Consent',
    description: () => descriptionComponent,
    actions: [
      {
        icon: 'lucide:check',
        label: 'Accept All',
        color: 'success',
        variant: 'solid',
        onClick: (e) => {
          e?.stopPropagation()
        }
      },
      {
        icon: 'lucide:x',
        label: 'Reject All',
        color: 'error',
        variant: 'solid',
        onClick: (e) => {
          e?.stopPropagation()
        }
      }
    ]
  })
}

onMounted(() => {
  if (!cookieBannerConsent.value) {
    cookieBannerConsent.value = true
    showCookieToast();
  }
});

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.svg' }
  ],
  htmlAttrs: {
    lang,
    dir
  }
})

useSeoMeta({
  titleTemplate: '%s - Rimelight Entertainment',
  ogImage: 'https://cdn.idantity.me/images/logos/logomark-white.webp',
  twitterImage: 'https://cdn.idantity.me/images/logos/logomark-white.webp',
  twitterCard: 'summary_large_image'
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('blog'), {
  transform: data => data.find(item => item.path === '/blog')?.children || []
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('blog'), {
  server: false
})

const route = useRoute()

const bannerActions = ref([
  {
    color: 'neutral',
    label: 'View on GitHub',
    trailingIcon: 'mdi:github',
    to: 'https://github.com/Rimelight-Entertainment/rimelight.com',
  }
])

const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Franchises',
    to: '/franchises',
    active: route.path.startsWith('/franchises'),
    children: [
      {

      }
    ]
  },
  {
    label: 'Forums',
    to: '/forums',
    active: route.path.startsWith('/forums')
  },
  {
    label: 'Events',
    to: '/events',
    active: route.path.startsWith('/events')
  },
  {
    label: 'Store',
    to: '/store',
    active: route.path.startsWith('/store')
  },
  {
    label: 'Company',
    to: '/company',
    active: route.path.startsWith('/company'),
    children: [
      {
        label: 'History',
        icon: 'lucide:book',
        description: 'Learn about our beginnings and our mission.',
        to: '/company/history',
      },
      {
        label: 'Jobs',
        icon: 'lucide:briefcase',
        description: 'Check out our currently open positions and their requirements.!',
        to: '/company/jobs',
      },
      {
        label: 'Studios',
        icon: 'lucide:building-2',
        description: 'Take a tour of our facilities.',
        to: '/company/studios',
      },
      {
        label: 'Benefits',
        icon: 'lucide:hand-heart',
        description: 'Discover what benefits and compensations are available to our employees.',
        to: '/company/benefits',
      },
    ]
  },
  {
    label: 'Internal',
    to: '/internal',
    active: route.path.startsWith('/internal')
  }
])

const columns: FooterColumn[] = [
  {
    label: 'Resources',
    children: [
      {
        label: 'Branding',
        to: '/branding',
      }
    ]
  },
  {
    label: 'Documents',
    children: [
      {
        label: 'Privacy Policy',
        to: '/documents/policies/privacy-policy/',
      },
      {
        label: 'Cookie Policy',
        to: '/documents/policies/cookie-policy/',
      },
      {
        label: 'Terms of Service',
        to: '/documents/policies/terms-of-service/',
      },
      {
        label: 'Code of Conduct',
        to: '/documents/policies/code-of-conduct/',
      },
      {
        label: 'Other Documents',
        to: '/documents/policies/other-documents/',
      }
    ]
  }
]

provide('navigation', navigation)
</script>

<template>
  <UApp :locale="locales[locale]">
    <div v-if="isUnlocked">
      <NuxtLoadingIndicator color="primary"/>
      <UBanner color="info" icon="material-symbols:construction" title="This website is currently under construction. Feel free to report any issues!" :actions="bannerActions" close close-icon="material-symbols:close"/>
      <UHeader mode="slideover" toggle-side="left" to="/">
        <template #title>
          <NuxtImg src="https://cdn.idantity.me/images/logos/logomark-white.webp" alt="Rimelight Entertainment Logomark" class="h-12 w-auto" />
        </template>
        <UNavigationMenu :items="headerItems" variant="link"/>
        <template #body>
          <UNavigationMenu :items="headerItems" variant="link" orientation="vertical" class="-mx-2.5" />
        </template>
        <template #right>
          <RLLayoutBox
            direction="horizontal"
            gap="sm"
          >
            <UButton variant="link" color="neutral" label="Account"/>
            <UButton variant="link" color="neutral" leadingIcon="lucide:circle-help" label="Support" />
            <UButton variant="link" color="neutral" leadingIcon="lucide:settings" label="Settings" />
            <RLLayoutBox
              direction="horizontal"
              gap="md"
            >
              <UButton variant="solid" color="primary" label="Log In" />
              <UButton variant="outline" color="primary" label="Sign Up" />
            </RLLayoutBox>
          </RLLayoutBox>
          <UFieldGroup>
            <ULocaleSelect hidden v-model="locale" :locales="[ar, en, es, fr, ja, ko, pt, ro, zh_cn]" @update:model-value="setLocale($event)" color="secondary" class="w-48" />
            <UColorModeButton/>
          </UFieldGroup>
        </template>
      </UHeader>
      <UMain>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <ClientOnly>
          <LazyUContentSearch
            :files="files"
            shortcut="meta_k"
            :navigation="navigation"
            :links="headerItems"
            :fuse="{ resultLimit: 42 }"
          />
        </ClientOnly>
      </UMain>
      <UFooter>
        <template #left>
          <RLLayoutBox direction="vertical" gap="sm">
            <NuxtLink to="/">
              <NuxtImg src="https://cdn.idantity.me/images/logos/logotype-white.webp" alt="idantity.me Logotype" class="h-12"/>
            </NuxtLink>
            <p class="text-muted text-sm">
              © {{ new Date().getFullYear() }} Rimelight Entertainment
            </p>
          </RLLayoutBox>
        </template>
        <template #top>
          <UContainer>
            <UFooterColumns :columns="columns">
            </UFooterColumns>
          </UContainer>
        </template>
        <template #right>
          <UFieldGroup>
            <UButton size="xl" variant="ghost" icon="mdi:instagram" to="https://www.instagram.com/idantity.me" :ui="{ leadingIcon: 'text-white' }"/>
            <UButton size="xl" variant="ghost" icon="ic:baseline-discord" to="https://discord.com/users/682049695173836979" :ui="{ leadingIcon: 'text-white' }"/>
            <UButton size="xl" variant="ghost" icon="mdi:spotify" to="https://open.spotify.com/user/v5m4qoc9j35ccc6nbzqcookvj?si=d795f9bc1cb34222" :ui="{ leadingIcon: 'text-white' }"/>
            <UButton size="xl" variant="ghost" icon="mdi:github" to="https://www.github.com/idantitydotme" :ui="{ leadingIcon: 'text-white' }"/>
            <UButton size="xl" variant="ghost" icon="mdi:linkedin" to="https://www.linkedin.com/daniel-marchi" :ui="{ leadingIcon: 'text-white' }"/>
          </UFieldGroup>
        </template>
      </UFooter>
    </div>
    <div v-else class="flex min-h-screen items-center justify-center bg-background">
      <UnderConstruction />
    </div>
  </UApp>
</template>