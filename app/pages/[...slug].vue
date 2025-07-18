<script setup lang="ts">
import { useRoute, useHead, useAsyncData, createError, useRuntimeConfig } from '#app';
import { computed } from 'vue';
import type { ApiErrorResponse } from "@/types/api";
import type { EntryData } from '~/types/Entry';
import EntryLayout from "~/components/basic/entry/EntryLayout.vue";

const route = useRoute();
const config = useRuntimeConfig();

let locale: string | undefined;
let rawSlugArray: string[];

const routeParams = route.params;

if (Array.isArray(routeParams.slug)) {
  rawSlugArray = routeParams.slug;
  locale = routeParams.locale as string || 'en';
} else {
  rawSlugArray = [routeParams.slug as string];
  locale = routeParams.locale as string || 'en';
}

const entrySlug = rawSlugArray.join('/');
const requestSlug = entrySlug === '' ? 'index' : entrySlug;

console.log(`[entries/[...slug].vue] Rendering for locale: ${locale}`);
console.log(`[entries/[...slug].vue] Raw slug array:`, rawSlugArray);
console.log(`[entries/[...slug].vue] Constructed entrySlug: ${entrySlug}`);
console.log(`[entries/[...slug].vue] Requesting API for slug: ${requestSlug}`);

const isEditorMode = computed(() => route.query.mode === 'editor');

const fetchEntryData = async () => {
  try {
    const response = await $fetch.raw(`${config.public.apiBase}/api/entries/${requestSlug}`);

    if (response.status === 200) {
      return response._data as EntryData;
    } else {
      // Instead of throwing createError directly here,
      // return an error that useAsyncData will catch and assign to its error ref.
      // This allows the component to display a custom error message without a full Nuxt error page.
      // For non-200 responses, we'll create an Error object that useAsyncData can handle.
      const errorMessage = response.statusText || 'Failed to fetch entry data';
      const error = new Error(errorMessage) as Error & { statusCode?: number };
      error.statusCode = response.status;
      throw error; // Throwing here will be caught by the outer try-catch of useAsyncData
    }
  } catch (err: unknown) {
    console.error(`[entries/[...slug].vue] Error fetching entry "${requestSlug}":`, err);

    // Standardized error handling to convert various error types into a consistent Error object
    if (
        typeof err === 'object' &&
        err !== null &&
        'statusCode' in err
    ) {
      // This path is for errors that already have a statusCode, like an ApiErrorResponse
      const apiError = err as ApiErrorResponse;
      const error = new Error(apiError.message || 'Server error fetching entry.') as Error & { statusCode?: number };
      error.statusCode = apiError.statusCode;
      throw error;
    } else if (err instanceof Error) {
      // Generic Error instance
      const error = err as Error & { statusCode?: number };
      error.statusCode = error.statusCode || 500; // Assign 500 if no specific status code exists
      throw error;
    } else {
      // Catch-all for unknown error types
      const error = new Error(`An unexpected error occurred while loading entry: ${requestSlug}`) as Error & { statusCode?: number };
      error.statusCode = 500;
      throw error;
    }
  }
};


const { data: entryData, pending, error } = useAsyncData<EntryData>(
    `entry-${requestSlug}-${isEditorMode.value}`,
    fetchEntryData,
    {
      watch: [
        () => route.path,
        () => route.query.mode,
      ],
      // If `default` is provided, it will be used as the initial value for `data`
      // and will not trigger a 404 if the fetch fails initially.
      // If you want a 404 for actual not found entries, remove `default`.
      // default: () => null, // Or some default empty EntryData object
    }
);

// If there's an error and it's a 404 specifically, then trigger a Nuxt error page.
// This allows other errors to be handled in the template, giving more flexibility.
if (error.value && error.value.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Entry Not Found',
    message: `The entry "${entrySlug}" does not exist.`,
    fatal: true,
  });
}

// Fallback for when data is truly not found after asyncData has finished and no specific error was set.
// This is a safeguard if the API returns 200 with no data for a "not found" scenario
// or if `error.value` is somehow not populated for a 404.
// Make sure this check happens *after* useAsyncData has completed its first run.
if (!entryData.value && !pending.value && !error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Entry Not Found',
    message: `The entry "${entrySlug}" does not exist.`,
    fatal: true,
  });
}


useHead(() => ({
  title: entryData.value?.title || 'Loading Entry...',
}));
</script>

<template>
  <div>
    <div v-if="error">
      <h1>Error {{ error.statusCode }}</h1>
      <p>{{ error.message }}</p>
      <p>Please try again later or check the URL.</p>
    </div>
    <EntryLayout
        v-else-if="entryData"
        :initial-entry-data="entryData"
        :locale="locale"
        :is-editable="isEditorMode" />
    <div v-else>
      No entry data available.
    </div>
  </div>
</template>