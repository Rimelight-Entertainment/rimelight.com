<script setup lang="ts">
import { h, computed } from "vue";
import type { VNode, SetupContext } from "vue";
import { cva } from "class-variance-authority";
import LayoutBox from "~/components/basic/base/LayoutBox.vue";
import type { EntryData } from '~/types/Entry';
import type { Heading } from "~/composables/Entry/useTableOfContents";
import { useTableOfContents  } from "~/composables/Entry/useTableOfContents";

type HeadingLevel = 0 | 1 | 2 | 3;

interface NestedHeading extends Heading {
  children?: NestedHeading[];
}

interface TableOfContentsProps {
  entryData: EntryData;
}

const props = defineProps<TableOfContentsProps>();

const headingLinkVariants = cva(
    "block transition-colors duration-200 hover:text-rimelight-primary-300",
    {
      variants: {
        level: {
          0: "text-sm text-rimelight-primary-100 pl-0",
          1: "ml-md text-sm text-rimelight-primary-100 pl-md",
          2: "ml-lg text-sm text-rimelight-primary-100 pl-lg",
          3: "ml-xl text-xs text-rimelight-primary-100 pl-xl",
        },
      },
      defaultVariants: {
        level: 0,
      },
    },
);

const { headings: entryHeadings, navigateToSection: handleNavigateToSection } =
    useTableOfContents(computed(() => props.entryData.blocks));

const HeadingItem = {
  name: "HeadingItem",
  props: {
    heading: {
      type: Object as () => NestedHeading,
      required: true,
    },
  },
  setup(props: { heading: NestedHeading }, context: SetupContext) {
    const anchorVNode: VNode = h(
        "a",
        {
          href: `#${props.heading.id}`,
          onClick: (e: Event) => {
            e.preventDefault();
            context.emit("navigate", props.heading.id);
          },
          class: headingLinkVariants({
            level: Math.min(props.heading.level, 3) as HeadingLevel,
          }),
        },
        props.heading.title,
    );

    return () =>
        h(
            "li",
            {},
            [
              anchorVNode,
              props.heading.children && props.heading.children.length > 0
                  ? h(
                      "ul",
                      {},
                      props.heading.children.map((child: NestedHeading) =>
                          h(HeadingItem, {
                            key: child.id, // Key for child components
                            heading: child,
                            onNavigate: (id: string) => context.emit("navigate", id),
                          }),
                      ),
                  )
                  : null,
            ],
        );
  },
};

const topLevelHeadings = computed(() => buildHeadingTree(entryHeadings.value));

/**
 * Builds a nested tree structure from a flat array of headings.
 * This function handles the hierarchical organization of headings based on their levels.
 * It ensures that headings are nested under their direct parent levels.
 */
function buildHeadingTree(headings: Heading[]): NestedHeading[] {
  const tree: NestedHeading[] = [];
  // Use a map to quickly access the last encountered heading at each level.
  const levelMap: Map<number, NestedHeading> = new Map();

  headings.forEach((h) => {
    const nestedH: NestedHeading = { ...h, children: [] };
    levelMap.set(h.level, nestedH); // Always update the last heading at this level

    // If the current heading is not a top-level heading
    if (h.level > 0) {
      // Find the direct parent at the previous level
      const parent = levelMap.get(h.level - 1);
      if (parent) {
        parent.children?.push(nestedH);
      } else {
        // If no direct parent is found, add to the top level.
        // This handles cases where heading levels might not be strictly sequential (e.g., H1 -> H3).
        // Depending on requirements, you might want to throw an error or log a warning here.
        tree.push(nestedH);
      }
    } else {
      // Top-level heading
      tree.push(nestedH);
    }

    // Clear entries for levels deeper than the current heading.
    // This is crucial to prevent incorrect nesting if a lower level heading appears before its logical parent.
    for (let i = h.level + 1; i <= Math.max(...Array.from(levelMap.keys())); i++) {
      levelMap.delete(i);
    }
  });
  return tree;
}
</script>

<template>
  <LayoutBox
      v-if="entryHeadings && entryHeadings.length > 0"
      tag="nav"
      direction="vertical"
      padding="lg"
      gap="md"
      class="document-editor-scrollbar sticky top-16 h-fit max-w-[256px] min-w-[256px] overflow-y-auto bg-rimelight-primary-900 shadow-lg"
  >
    <h1 class="text-md font-bold text-rimelight-primary-100">
      Table of Contents
    </h1>
    <LayoutBox tag="ul" direction="vertical" gap="md">
      <component
          :is="HeadingItem"
          v-for="heading in topLevelHeadings"
          :key="heading.id"
          :heading="heading"
          @navigate="handleNavigateToSection"
      />
    </LayoutBox>
  </LayoutBox>
</template>