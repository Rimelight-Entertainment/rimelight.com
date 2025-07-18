<script setup lang="ts">
import HeaderTab from '~/components/basic/navigation/HeaderTab.vue';
import DropdownItem from '~/components/basic/navigation/DropdownItem.vue';
import MegaMenuItem from '~/components/basic/navigation/MegaMenuItem.vue';
import Button from '~/components/basic/base/Button.vue';
import LayoutBox from "~/components/basic/base/LayoutBox.vue";
</script>

<template>
  <LayoutBox tag="header" direction="horizontal" align-items="center" justify-content="center" class="sticky top-0 z-50 h-8bg-rimelight-primary-600 shadow-lg">
    <LayoutBox tag="nav" direction="horizontal" justify-content="between" class="max-w-[1440px]">
      <LayoutBox tag="ul" direction="horizontal">
        <HeaderTab label="Franchises" />
        <HeaderTab label="Forums" href="/forums" />
        <HeaderTab label="Events" />
        <HeaderTab label="Store" href="/store" />
        <HeaderTab label="Company" has-dropdown dropdown-type="megamenu" >
          <LayoutBox direction="horizontal" gap="xl" justify-content="between">
            <div class="grid grid-cols-2 gap-md">
              <LayoutBox>
                <h5>About Us</h5>
                <MegaMenuItem
                    href="/company/about-us/history"
                    icon-name="navigation.history"
                    title="History"
                    description="Learn about our beginnings and our mission."
                />
                <MegaMenuItem
                    href="/company/about-us/branding"
                    icon-name="navigation.branding"
                    title="Branding"
                    description="Here you'll find our branding assets, style guides, and usage guidelines."
                />
              </LayoutBox>

              <LayoutBox>
                <h5>Careers</h5>
                <MegaMenuItem
                    href="/company/careers/jobs"
                    icon-name="navigation.jobs"
                    title="Jobs"
                    description="Check out our currently open positions and their requirements."
                />
                <MegaMenuItem
                    href="/company/careers/studios"
                    icon-name="navigation.studios"
                    title="Studios"
                    description="Take a tour of our facilities."
                />
                <MegaMenuItem
                    href="/company/careers/benefits"
                    icon-name="navigation.benefits"
                    title="Benefits"
                    description="Discover what benefits and compensations are available to our employees."
                />
              </LayoutBox>
            </div>
            <LayoutBox>
              <h5>Company Documents</h5>
              <ul class="m-0 list-none p-0">
                <DropdownItem
                    href="/company/docs/terms-of-service"
                    label="Terms of Service"
                    icon-name="navigation.document"
                />
                <DropdownItem
                    href="/company/docs/privacy-policy"
                    label="Privacy Policy"
                    icon-name="navigation.document"
                />
                <DropdownItem
                    href="/company/docs/cookie-policy"
                    label="Cookie Policy"
                    icon-name="navigation.document"
                />
                <DropdownItem
                    href="/company/docs/code-of-conduct"
                    label="Code of Conduct"
                    icon-name="navigation.document"
                />
              </ul>
            </LayoutBox>
          </LayoutBox>
        </HeaderTab>
        <HeaderTab label="Internal" href="/internal" />
      </LayoutBox>
      <LayoutBox direction="horizontal" gap="lg" align-items="center">
        <HeaderTab
            label="Username"
            has-dropdown
            dropdown-class-name="bg-rimelight-neutral-800 w-max"
            dropdown-type="normal"
        >
          <DropdownItem
              href="/account"
              label="Account"
              icon-name="navigation.account"
          />
          <DropdownItem
              href="/support"
              label="Support"
              icon-name="navigation.support"
          />
          <DropdownItem
              href="/settings"
              label="Settings"
              icon-name="navigation.settings"
          />
          <DropdownItem
              href="/log-out"
              label="Log Out"
              icon-name="navigation.logOut"
          />
        </HeaderTab>
        <Button variant="ghost" size="sm" text="Log In" />
        <Button variant="ghost" size="sm" text="Sign Up" />
      </LayoutBox>
    </LayoutBox>
  </LayoutBox>
</template>

<style scoped>

</style>