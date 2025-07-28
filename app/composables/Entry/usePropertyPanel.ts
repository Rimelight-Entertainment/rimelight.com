import type { Ref } from "vue";
import { computed  } from "vue";
import type { EntryData } from "#shared-types/Entry";

/**
 * Options for the usePropertyPanel composable.
 */
interface UsePropertyPanelOptions {
    /**
     * A reactive reference to the EntryData object that this panel will manage.
     * The composable will read from and update this ref.
     */
    entryData: Ref<EntryData>;
}

/**
 * Composable to provide logic and handlers for a entry property panel.
 * It manages changes to the entry title and general entry properties.
 *
 * @param options - An object containing a reactive reference to the EntryData.
 * @returns An object containing reactive entry title and properties,
 * along with handler functions to update them.
 */
export const usePropertyPanel = ({
                                     entryData,
                                 }: UsePropertyPanelOptions) => {
    // Derive entryTitle reactively from entryData
    const entryTitle = computed(() => entryData.value?.title || '');

    // Derive entryProperties reactively from entryData
    const entryProperties = computed(() => entryData.value?.properties || {});

    /**
     * Handles changes to the entry title.
     * Directly updates the `title` property of the `entryData` ref.
     * @param newTitleString - The new title string.
     */
    const handleEntryTitleChange = (newTitleString: string) => {
        if (!entryData.value) {
            // Handle the case where entryData.value is not yet set
            console.warn("entryData.value is not initialized when attempting to change title.");
            return;
        }
        entryData.value = {
            ...entryData.value,
            title: newTitleString,
        };
    };

    /**
     * Handles changes to the entry's custom properties.
     * Directly updates the `properties` object of the `entryData` ref.
     * @param updatedProperties - The new record of properties.
     */
    const handleEntryPropertiesChange = (
        updatedProperties: Record<string, unknown>,
    ) => {
        if (!entryData.value) {
            console.warn("entryData.value is not initialized when attempting to change properties.");
            return;
        }
        entryData.value = {
            ...entryData.value,
            properties: updatedProperties,
        };
    };

    return {
        entryTitle,
        entryProperties,
        handleEntryTitleChange,
        handleEntryPropertiesChange,
    };
};