<script setup lang="ts">

</script>

<template>
  <RLLayoutBox
      direction="vertical"
      gap="xl"
      align-items="center"
      justify-content="center"
  >
    <h1 class="text-6xl font-bold">History</h1>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    <h1 class="text-6xl font-bold">Team</h1>
    <p>Rimelight Entertainment was established by these individuals.</p>
    <RLLayoutBox
        direction="horizontal"
        gap="xl"
        justify-content="center"
    >
      <RLTeamCard
          src="/team/daniel-marchi.webp"
          alt="Daniel Marchi"
          name="Daniel Marchi"
          role="Founder"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      >
        <template #buttons>
          <RLButton
              href="https://idantity.me"
              variant="ghost"
              size="md"
              start-icon="general:website"
          />
          <RLButton
              href="https://instagram.com/idantity.me"
              variant="ghost"
              size="md"
              start-icon="third-party:instagram"
          />
          <RLButton
              href="https://linkedin.com/daniel-marchi"
              variant="ghost"
              size="md"
              start-icon="third-party:linkedin"
          />
          <RLButton
              href="https://github.com/idantitydotme"
              variant="ghost"
              size="md"
              start-icon="third-party:github"
          />
        </template>
      </RLTeamCard>
    </RLLayoutBox>
  </RLLayoutBox>
</template>

<style scoped>

</style>