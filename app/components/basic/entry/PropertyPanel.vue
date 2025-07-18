<script setup lang="ts">
import { computed } from 'vue';
import type { PropertyPanelSchema, EntryType, EntryData } from '~/types/Entry';
import type { InlineNode, TextNode } from '~/types/blocks';
import NumberProperty from './properties/NumberProperty.vue';
import TextProperty from './properties/TextProperty.vue';
import TextArrayProperty from './properties/TextArrayProperty.vue';
import EnumProperty from './properties/EnumProperty.vue';
import LinkedEntryProperty from './properties/LinkedEntryProperty.vue';
import EntryArrayProperty from './properties/EntryArrayProperty.vue';
import EditableText from '~/components/basic/entry/base/EditableText.vue';
import LayoutBox from '~/components/basic/base/LayoutBox.vue';
import { usePropertyPanel } from '~/composables/Entry/usePropertyPanel';

interface PropertyPanelProps {
  entryData: EntryData;
  displaySchema?: Record<string, Record<string, PropertyPanelSchema>>;
  isEditable?: boolean;
}

const props = withDefaults(defineProps<PropertyPanelProps>(), {
  isEditable: false,
  displaySchema: undefined,
  className: '',
});

const {
  entryTitle,
  entryProperties,
  handleEntryTitleChange,
  handleEntryPropertiesChange,
} = usePropertyPanel({ entryData: computed(() => props.entryData) });

const handleTitleChangeInternal = (newValue: Array<TextNode | InlineNode>) => {
  const newTitleString = newValue
      .map((node) => {
        if ('text' in node) {
          return node.text;
        }
        return '';
      })
      .join('');
  handleEntryTitleChange(newTitleString);
};

const handlePropertyChangeInternal = (key: string, newValue: unknown) => {
  const updatedProperties = {
    ...entryProperties.value,
    [key]: newValue,
  };
  handleEntryPropertiesChange(updatedProperties);
};


const propertyComponentMap = {
  number: NumberProperty,
  text: TextProperty,
  'text-array': TextArrayProperty,
  enum: EnumProperty,
  entry: LinkedEntryProperty,
  'entry-array': EntryArrayProperty,
};

const sortedCategoryKeys = computed(() => {
  if (!props.displaySchema) return [];
  return Object.keys(props.displaySchema);
});

const getSortedPropertyKeys = (categoryProperties: Record<string, PropertyPanelSchema>) => {
  return Object.keys(categoryProperties).sort((a, b) => {
    const orderA = categoryProperties[a]?.order ?? Infinity;
    const orderB = categoryProperties[b]?.order ?? Infinity;
    return orderA - orderB;
  });
};

// Define specific prop interfaces for each property component type
interface NumberPropertyComponentProps {
  label: string;
  value: number | undefined;
  isEditable: boolean;
  blockId: string;
}

interface TextPropertyComponentProps {
  label: string;
  value: string | Array<TextNode | InlineNode> | undefined;
  isEditable: boolean;
  blockId: string;
}

interface TextArrayPropertyComponentProps {
  label: string;
  value: Array<string | Array<TextNode | InlineNode>> | undefined;
  isEditable: boolean;
  blockId: string;
}

interface EnumPropertyComponentProps {
  label: string;
  value: string | undefined;
  options: string[];
  isEditable: boolean;
  blockId: string;
}

interface LinkedEntryPropertyComponentProps {
  label: string;
  value: string | undefined;
  isEditable: boolean;
  allowedEntryTypes?: EntryType[];
  blockId: string;
}

interface EntryArrayPropertyComponentProps {
  label: string;
  value: string[] | undefined;
  isEditable: boolean;
  allowedEntryTypes?: EntryType[];
  blockId: string;
}

type PropertyComponentProps =
    | NumberPropertyComponentProps
    | TextPropertyComponentProps
    | TextArrayPropertyComponentProps
    | EnumPropertyComponentProps
    | LinkedEntryPropertyComponentProps
    | EntryArrayPropertyComponentProps;

const getComponentProps = (
    propSchema: PropertyPanelSchema,
    propValue: unknown,
    propKey: string,
    isEditable: boolean,
): PropertyComponentProps => {
  const baseProps = {
    label: propSchema.label,
    isEditable: isEditable,
    blockId: `prop-${propKey}`,
  };

  switch (propSchema.type) {
    case 'number':
      return {
        ...baseProps,
        value: propValue as number | undefined,
      } as NumberPropertyComponentProps; // Assert to the specific interface
    case 'text':
      return {
        ...baseProps,
        value: propValue as string | Array<TextNode | InlineNode> | undefined,
      } as TextPropertyComponentProps;
    case 'text-array':
      return {
        ...baseProps,
        value: propValue as Array<string | Array<TextNode | InlineNode>> | undefined,
      } as TextArrayPropertyComponentProps;
    case 'enum':
      return {
        ...baseProps,
        value: propValue as string | undefined,
        options: (propSchema.options || []) as string[],
      } as EnumPropertyComponentProps;
    case 'entry':
      return {
        ...baseProps,
        value: propValue as string | undefined,
        allowedEntryTypes: propSchema.allowedEntryTypes as EntryType[] | undefined,
      } as LinkedEntryPropertyComponentProps;
    case 'entry-array':
      return {
        ...baseProps,
        value: propValue as string[] | undefined,
        allowedEntryTypes: propSchema.allowedEntryTypes as EntryType[] | undefined,
      } as EntryArrayPropertyComponentProps;
    default:
      return { ...baseProps, value: propValue as string | undefined } as TextPropertyComponentProps; // Defaulting to TextProperty type as a safe fallback
  }
};
</script>

<template>
  <aside>
    <LayoutBox
        direction="vertical"
        class="max-w-[256px] min-w-[256px] border border-rimelight-primary-500 bg-rimelight-primary-800 shadow-lg"
    >
      <div class="bg-rimelight-primary-500 p-sm shadow-lg">
        <EditableText
            :value="entryTitle"
            :on-value-change="handleTitleChangeInternal"
            :is-editable="props.isEditable"
            :supported-marks="[]"
            class="w-full text-center text-lg font-bold text-rimelight-primary-100"
            root-tag="h1"
        />
      </div>

      <template v-if="props.displaySchema && Object.keys(props.displaySchema).length > 0">
        <template v-for="categoryKey in sortedCategoryKeys" :key="categoryKey">
          <template v-if="props.displaySchema[categoryKey]">
            <section>
              <h2
                  v-if="
                  props.displaySchema[categoryKey] &&
                  Object.keys(props.displaySchema[categoryKey]).length > 0
                "
                  class="bg-rimelight-primary-600 p-sm text-center text-md font-semibold text-rimelight-primary-100"
              >
                {{ categoryKey === '_uncategorized_' ? 'Other Details' : categoryKey }}
              </h2>
              <dl>
                <div
                    v-for="propKey in getSortedPropertyKeys(props.displaySchema[categoryKey])"
                    :key="propKey"
                    class="flex flex-col gap-sm p-md"
                >
                  <component
                      :is="propertyComponentMap[props.displaySchema[categoryKey][propKey].type]"
                      v-bind="getComponentProps(
                          props.displaySchema[categoryKey][propKey],
                          entryProperties[propKey],
                          propKey,
                          props.isEditable
                      )"
                      @update:model-value="(newValue) => handlePropertyChangeInternal(propKey, newValue)"
                  />
                </div>
              </dl>
            </section>
          </template>
        </template>
      </template>
      <template v-else />
    </LayoutBox>
  </aside>
</template>