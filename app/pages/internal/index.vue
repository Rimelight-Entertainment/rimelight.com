<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard'
})

const items: TabsItem[] = [
  {
    label: 'All',
    value: 'all'
  },
  {
    label: 'Unread',
    value: 'unread'
  }
]

const navigationItems: NavigationMenuItem[][] = [
  [
    {
      label: 'General',
      icon: 'i-lucide-user',
      active: true
    },
    {
      label: 'Members',
      icon: 'i-lucide-users'
    },
    {
      label: 'Notifications',
      icon: 'i-lucide-bell'
    }
  ],
  [
    {
      label: 'Documentation',
      icon: 'i-lucide-book-open',
      to: 'https://ui.nuxt.com/docs',
      target: '_blank'
    },
    {
      label: 'Help & Feedback',
      icon: 'i-lucide-help-circle',
      to: 'https://github.com/nuxt/ui/issues',
      target: '_blank'
    }
  ]
]

const dashboardItems: NavigationMenuItem[][] = [
  [
    {
      label: 'Home',
      icon: 'i-lucide-house',
      active: true
    },
    {
      label: 'Inbox',
      icon: 'i-lucide-inbox',
      badge: '4'
    },
    {
      label: 'Contacts',
      icon: 'i-lucide-users'
    }
  ],
  [
    {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com/nuxt/ui',
      target: '_blank'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      defaultOpen: false,
      children: [
        {
          label: 'General'
        },
        {
          label: 'Members'
        },
        {
          label: 'Notifications'
        }
      ]
    }
  ]
]
</script>

<template>
  <UDashboardSidebar>
    <template #header="{ collapsed }">
      <h3>Dashboard</h3>
    </template>

    <template #default="{ collapsed }">
      <UDashboardSearchButton class="w-full"/>
      <UNavigationMenu
        :collapsed="collapsed"
        :items="dashboardItems[0]"
        orientation="vertical"
      />

      <UNavigationMenu
        :collapsed="collapsed"
        :items="dashboardItems[1]"
        orientation="vertical"
        class="mt-auto"
      />
    </template>

    <template #footer="{ collapsed }">
      <UButton
        :avatar="{
        src: 'https://cdn.idantity.me/images/me/daniel-marchi.webp'
      }"
        :label="collapsed ? undefined : 'Daniel Marchi'"
        color="neutral"
        variant="ghost"
        class="w-full"
        :block="collapsed"
      />
    </template>
  </UDashboardSidebar>
  <slot />
  <UDashboardPanel id="inbox-1">
    <template #header>
      <UDashboardNavbar title="Inbox">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge label="4" variant="subtle" />
        </template>

        <template #right>
          <UTabs :items="items" default-value="all" size="sm" class="w-40" :content="false" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="navigationItems" />
      </UDashboardToolbar>
    </template>
  </UDashboardPanel>
  <UDashboardSidebar side="right" toggle-side="right">
    <template #header="{ collapsed }">
      <NuxtImg src="https://cdn.idantity.me/images/logos/logomark-white.webp" alt="Rimelight Entertainment Logomark" class="h-12 w-auto" />
      <UDashboardSearchButton class="w-full"/>
    </template>
    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        :items="dashboardItems[0]"
        orientation="vertical"
      />
      <UNavigationMenu
        :collapsed="collapsed"
        :items="dashboardItems[1]"
        orientation="vertical"
        class="mt-auto"
      />
    </template>
    <template #footer="{ collapsed }">
      <UButton
        :avatar="{
        src: 'https://cdn.idantity.me/images/me/daniel-marchi.webp'
      }"
        :label="collapsed ? undefined : 'Daniel Marchi'"
        color="neutral"
        variant="ghost"
        class="w-full"
        :block="collapsed"
      />
    </template>
  </UDashboardSidebar>
</template>

<style scoped>

</style>