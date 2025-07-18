import { computed   } from "vue";
import type {Ref, ComputedRef} from "vue";
import type { BlockData, SectionBlockData } from "~/types/blocks";

/**
 * Represents a heading extracted from the block data.
 */
export interface Heading {
    id: string;
    title: string;
    level: number;
}

/**
 * The result object returned by the `useTableOfContents` composable.
 */
interface UseTableOfContentsResult {
    headings: ComputedRef<Heading[]>;
    navigateToSection: (id: string) => void;
}

/**
 * Recursively collects headings from an array of blocks.
 * It assigns a level based on the nesting depth of 'section' blocks.
 *
 * @param blocks The array of BlockData to extract headings from.
 * @param currentLevel The current nesting level for headings.
 * @returns An array of collected Heading objects.
 */
const collectHeadings = (
    blocks: BlockData[],
    currentLevel: number,
): Heading[] => {
    const collected: Heading[] = [];

    // Ensure blocks is an array before calling forEach
    if (!blocks || !Array.isArray(blocks)) {
        return collected;
    }

    blocks.forEach((block) => {
        if (
            block.type === "section" &&
            (block as SectionBlockData).attrs.title.trim().length > 0
        ) {
            const sectionBlock = block as SectionBlockData;
            collected.push({
                id: sectionBlock.id,
                title: sectionBlock.attrs.title,
                level: currentLevel,
            });

            // Recursively collect headings from nested default slots
            if (sectionBlock.slots?.default) {
                collected.push(
                    ...collectHeadings(sectionBlock.slots.default, currentLevel + 1),
                );
            }
        }
    });

    return collected;
};

/**
 * Custom composable to extract headings from an array of blocks and provide navigation functionality.
 * Headings are derived from 'section' type blocks that have a 'title' attribute.
 *
 * @param blocks A Vue ref or reactive object containing the array of BlockData to extract headings from.
 * @returns An object containing the extracted headings and a function to navigate to a section.
 */
export const useTableOfContents = (
    blocks: Ref<BlockData[]> | ComputedRef<BlockData[]>,
): UseTableOfContentsResult => {
    const headings = computed(() => {
        return collectHeadings(blocks.value || [], 0);
    });

    const navigateToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            if (process.env.NODE_ENV === "development") {
                console.warn(`Attempted to navigate to unknown section ID: ${id}`);
            }
        }
    };

    return { headings, navigateToSection };
};