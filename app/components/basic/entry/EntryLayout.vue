<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { EntryData, EntryCategory } from '~/types/Entry';

import Button from '~/components/basic/base/Button.vue';
import BlockContent from '~/components/basic/entry/BlockContent.vue';
import TableOfContents from '~/components/basic/entry/TableOfContents.vue';
import PropertyPanel from '~/components/basic/entry/PropertyPanel.vue';
import Breadcrumb from '~/components/basic/entry/Breadcrumb.vue';
import NewEntryModal from '~/components/basic/entry/modals/NewEntryModal.vue';
import MoveEntryModal from '~/components/basic/entry/modals/MoveEntryModal.vue';
import ConvertEntryModal from '~/components/basic/entry/modals/ConvertEntryModal.vue';
import EditCategoriesModal from '~/components/basic/entry/modals/EditCategoriesModal.vue';
import BrowseEntriesModal from '~/components/basic/entry/modals/BrowseEntriesModal.vue';
import PlaceBlockModal from '~/components/basic/entry/modals/PlaceBlockModal.vue';
import EditableText from '~/components/basic/entry/base/EditableText.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';

import { useRoute } from 'vue-router';
import { useEntryEditor } from '~/composables/Entry/useEntryEditor';
import { useHotkeys } from '~/composables/useHotkeys';

interface EntryLayoutProps {
  initialEntryData: EntryData;
  locale: string;
  isEditable: boolean;
}

const props = defineProps<EntryLayoutProps>();

const route = useRoute();

const isBrowseEntriesModalOpen = ref(false);
const isNewEntryModalOpen = ref(false);
const isMoveEntryModalOpen = ref(false);
const isConvertEntryModalOpen = ref(false);
const isEditCategoriesModalOpen = ref(false);
const isPlaceBlockModalOpen = ref(false);

const {
  entryData,
  entryTemplate,
  saveStatus,
  error,
  displayLastModified,
  groupedBlocksForRendering,
  filteredAvailableBlocks,
  focusedIndex,
  searchTerm,
  handlePlaceBlockSelect,
  handleMainEntryTitleChange,
  handleSearchTermChange,
} = useEntryEditor({ initialEntryData: props.initialEntryData, isEditable: props.isEditable });

const handleUpdateCategories = (updatedCategories: EntryCategory[]) => {
  entryData.value = {
    ...entryData.value,
    categories: updatedCategories,
  };
};

const { registerHotkey, unregisterHotkey } = useHotkeys();

// Register hotkeys that open modals
onMounted(() => {
  registerHotkey('openPlaceBlockModal', {
    keys: ['='],
    handler: () => isPlaceBlockModalOpen.value = true,
    prevent: true,
    context: null,
  });
});

onUnmounted(() => {
  unregisterHotkey('openPlaceBlockModal');
});
</script>

<template>
  <LayoutBox
      direction="vertical"
      class="mx-auto mt-12 max-w-[1440px] bg-rimelight-primary-800"
  >
    <LayoutBox tag="nav" direction="vertical">
      <LayoutBox
          direction="horizontal"
          justify-content="between"
          align-items="center"
      >
        <LayoutBox v-if="props.isEditable" direction="vertical" gap="sm"/>
        <LayoutBox v-else direction="horizontal" gap="sm"/>

        <LayoutBox v-if="props.isEditable" direction="horizontal" gap="sm">
          <Button
              variant="primary"
              size="sm"
              text="View Entry"
              :href="`/${entryData.slug}`"
          />
          <Button
              variant="primary"
              size="sm"
              start-icon="folderOpen"
              text="Browse Entries"
              @click="isBrowseEntriesModalOpen = true"
          />
          <Button
              variant="primary"
              size="sm"
              text="New Entry"
              @click="isNewEntryModalOpen = true"
          />
          <Button
              variant="primary"
              size="sm"
              text="Move Entry"
              @click="isMoveEntryModalOpen = true"
          />
          <Button
              variant="primary"
              size="sm"
              text="Convert Entry"
              @click="isConvertEntryModalOpen = true"
          />
        </LayoutBox>
        <LayoutBox v-else direction="horizontal" gap="sm">
          <Button
              variant="primary"
              size="sm"
              text="Edit Entry"
              :href="`${route.path}?mode=editor`"
          />

        </LayoutBox>
      </LayoutBox>
      <LayoutBox
          direction="horizontal"
          justify-content="between"
          align-items="center"
          gap="sm"
          class="bg-rimelight-primary-900"
      >
        <LayoutBox v-if="props.isEditable" direction="horizontal" gap="sm">
          <Button variant="primary" size="sm" start-icon="undo" />
          <Button variant="primary" size="sm" start-icon="redo" />
        </LayoutBox>
        <LayoutBox v-else/>

        <LayoutBox v-if="props.isEditable" direction="horizontal" align-items="center" gap="sm">
          <span class="text-sm text-rimelight-primary-500">
            [Editor]
          </span>
          <span class="text-sm text-rimelight-primary-500">
            Save Status:
            <template v-if="saveStatus === 'idle'">Ready</template>
            <template v-else-if="saveStatus === 'saving'">Saving...</template>
            <template v-else-if="saveStatus === 'saved'">Saved!</template>
            <template v-else-if="saveStatus === 'error'">Save Failed!</template>
            <span v-if="error" class="ml-sm text-rimelight-danger-500">
              {{ error }}
            </span>
          </span>
          <Button
              variant="primary"
              size="sm"
              start-icon="add"
              @click="isPlaceBlockModalOpen = true"
          />
        </LayoutBox>
        <LayoutBox v-else/>
      </LayoutBox>
    </LayoutBox>
    <LayoutBox
        direction="vertical"
        gap="lg"
        padding="xl"
        class="bg-rimelight-primary-700"
    >
      <LayoutBox direction="horizontal" gap="xl">
        <TableOfContents
            :entry-data="entryData"
        />
        <LayoutBox direction="vertical" gap="lg" class="flex-grow">
          <LayoutBox
              v-if="entryData?.slug"
              direction="horizontal"
              align-items="center"
              class="sticky top-10 z-20 -mt-6 mb-4 bg-rimelight-primary-700 pt-6"
          >
            <Breadcrumb :entry-data="entryData" />
          </LayoutBox>
          <LayoutBox direction="vertical" gap="lg" class="flex-grow">
            <EditableText
                :value="entryData.title"
                :is-editable="props.isEditable"
                :supported-marks="[]"
                class="-mt-2 text-5xl font-bold text-rimelight-primary-100"
                :on-value-change="handleMainEntryTitleChange"
                @update:value="handleMainEntryTitleChange"
            />
            <LayoutBox
                v-if="entryData.categories"
                direction="horizontal"
                align-items="center"
                gap="md"
                class="flex-wrap"
            >
              <template v-if="entryData.categories.length > 0">
                <span
                    v-for="(category, index) in entryData.categories"
                    :key="`${category}-${index}`"
                    class="rounded-md bg-rimelight-primary-900 px-4 py-2 text-sm text-rimelight-primary-100"
                >
                  {{ category }}
                </span>
              </template>
              <span v-else-if="props.isEditable" class="text-sm text-rimelight-primary-500">
              No categories added.
            </span>
              <Button
                  v-if="props.isEditable"
                  variant="ghost"
                  size="sm"
                  start-icon="edit"
                  text="Edit Categories"
                  @click="isEditCategoriesModalOpen = true"
              />
            </LayoutBox>
            <BlockContent
                :is-editable="props.isEditable"
                :blocks-data="entryData.blocks"
            />
          </LayoutBox>

        </LayoutBox>
        <PropertyPanel
            v-if="entryTemplate.propertyPanelSchema && Object.keys(entryTemplate.propertyPanelSchema).length > 0"
            :entry-data="entryData"
            :display-schema="entryTemplate.propertyPanelSchema"
            :is-editable="props.isEditable"
        />
      </LayoutBox>
      <hr >
      <span class="text-sm text-rimelight-primary-100">
        Last modified: {{ displayLastModified }}
      </span>
    </LayoutBox>
  </LayoutBox>
  <NewEntryModal
      v-model:is-open="isNewEntryModalOpen"
  />
  <MoveEntryModal
      v-model:is-open="isMoveEntryModalOpen"
      :current-slug="props.initialEntryData.slug"
      :current-entry-id="props.initialEntryData.id"
  />
  <ConvertEntryModal
      v-model:is-open="isConvertEntryModalOpen"
      :current-entry-id="entryData.id"
      :current-entry-type="entryData.type"
      :current-slug="entryData.slug"
  />
  <BrowseEntriesModal
      v-model:is-open="isBrowseEntriesModalOpen"
  />
  <EditCategoriesModal
      v-model:is-open="isEditCategoriesModalOpen"
      :selected-categories="entryData.categories || []"
      @update-categories="handleUpdateCategories"
  />
  <PlaceBlockModal
      v-model:is-open="isPlaceBlockModalOpen"
      :grouped-blocks="groupedBlocksForRendering"
      :flat-blocks="filteredAvailableBlocks"
      :focused-index="focusedIndex"
      :search-term="searchTerm"
      @search-term-change="handleSearchTermChange"
      @select="handlePlaceBlockSelect"
  />
</template>

<style scoped>

</style>