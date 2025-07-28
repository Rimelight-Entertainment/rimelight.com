import { ref, watch  } from "vue";
import type {Ref} from "vue";
import type { EntryData } from "#shared-types/Entry";

export interface BreadcrumbItem {
    name: string;
    href: string;
}

/**
 * Custom composable to generate breadcrumbs for the current entry based on its slug.
 * It generates the path from the root to the current entry.
 *
 * @param entryData An EntryData object or a reactive object containing it.
 * @returns A Ref containing an array of BreadcrumbItem objects, representing the path.
 */
export const useBreadcrumbs = (entryData: EntryData): Ref<BreadcrumbItem[]> => {
    const breadcrumbs = ref<BreadcrumbItem[]>([]);

    const generateBreadcrumbs = () => {
        if (!entryData?.slug) {
            breadcrumbs.value = [];
            return;
        }

        const pathSegments = entryData.slug.split("/").filter(Boolean);
        const items: BreadcrumbItem[] = [];

        items.push({ name: "Home", href: "/" });

        let currentPath = "";
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;

            let displayName = segment;
            const href = `/${currentPath}`;

            if (i === pathSegments.length - 1) {
                displayName = entryData.title;
            }

            items.push({ name: displayName, href });
        }

        breadcrumbs.value = items;
    };

    watch(
        () => [entryData.slug, entryData.title],
        () => {
            generateBreadcrumbs();
        },
        { immediate: true }
    );

    return breadcrumbs;
};