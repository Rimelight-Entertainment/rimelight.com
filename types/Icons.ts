import { h, defineComponent } from 'vue';
import type { VNodeChild, Component } from 'vue';

export type IconComponent = Component;

export type IconMap = {
  [key: string]: IconComponent | IconMap;
};

/**
 * Type to generate all possible icon name strings based on the `iconMap` structure.
 * This provides TypeScript autocompletion and type safety for icon names.
 */
type Join<K, P> = K extends string | number ? P extends string | number ? `${K}${'' extends P ? '' : '.'}${P}` : never : never;

type ExtractPaths<T, CurrentPath extends string = ''> = {
    [K in keyof T]: K extends string
        ? T[K] extends IconComponent
            ? Join<CurrentPath, K>
            : T[K] extends IconMap
                ? ExtractPaths<T[K], Join<CurrentPath, K>>
                : never
        : never;
}[keyof T];

/**
 * Helper function to create a Vue component for an SVG icon.
 * It encapsulates the SVG structure and takes the path data, viewBox,
 * and an optional default title.
 *
 * @param pathD The 'd' attribute value for the SVG <path> element.
 * @param viewBox The 'viewBox' attribute value for the SVG element.
 * @param defaultTitle An optional default title for the icon.
 * @returns A Vue component definition for the SVG icon.
 */
function createSvgIcon(
    pathD: string,
    viewBox: string,
    defaultTitle?: string
): IconComponent {
    return defineComponent({
        props: {
            fill: { type: String, default: 'currentColor' },
            height: { type: String, default: '24px' },
            width: { type: String, default: '24px' },
            title: { type: String, default: undefined },
            description: { type: String, default: undefined },
            class: { type: [String, Array, Object], default: '' },
        },
        setup(props, { attrs }) {
            return () => {
                const children: VNodeChild[] = [];
                if (props.title || defaultTitle) {
                    children.push(h('title', props.title || defaultTitle));
                }
                if (props.description) {
                    children.push(h('desc', props.description));
                }
                children.push(h('path', { d: pathD }));

                return h('svg', {
                    ...attrs,
                    fill: props.fill,
                    height: props.height,
                    width: props.width,
                    viewBox: viewBox,
                    class: [props.class, attrs.class].filter(Boolean),
                }, children);
            };
        }
    });
}

/**
 * Retrieves an icon component from the `iconMap` based on its name.
 * It supports nested icon names (e.g., 'status.hint').
 *
 * @param name The full name of the icon to retrieve.
 * @returns The corresponding `IconComponent` or `undefined` if not found.
 */
export function getIconComponent(name: IconName): IconComponent | undefined {
    const pathParts = name.split(".");
    let current: IconComponent | IconMap | undefined = iconMap;

    for (const part of pathParts) {
        if (current && typeof current === "object" && part in current) {
            current = (current as IconMap)[part];
        } else {
            return undefined;
        }
    }

    if (typeof current === "function" || (typeof current === "object" && 'setup' in current) ) {
        return current as IconComponent;
    }

    return undefined;
}

export const iconMap: IconMap = {
    default: createSvgIcon(
        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
        "0 0 24 24",
        "Default Icon"
    ),
    add: createSvgIcon(
        "M453-454H220v-54h233v-233h54v233h233v54H507v233h-54v-233Z",
        "0 -960 960 960",
        "Add Icon"
    ),
    delete: createSvgIcon(
        "M308-140q-37 0-61.5-24.5T222-226v-498h-40v-54h176v-36h246v36h176v54h-40v498q0 36.73-24.64 61.36Q690.72-140 654-140H308Zm378-584H276v498q0 14 9 23t23 9h346q12 0 22-10t10-22v-498ZM381-275h54v-368h-54v368Zm146 0h54v-368h-54v368ZM276-724v530-530Z",
        "0 -960 960 960",
        "Delete Icon"
    ),
    close: createSvgIcon(
        "m252-212-38-40 227-228-227-230 38-40 229 230 227-230 38 40-227 230 227 228-38 40-227-230-229 230Z",
        "0 -960 960 960",
        "Close Icon"
    ),
    copy: createSvgIcon(
        "M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z",
        "0 -960 960 960",
        "Copy Icon"
    ),
    edit: createSvgIcon(
        "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",
        "0 -960 960 960",
        "Edit Icon"
    ),
    undo: createSvgIcon(
        "M303.5-257v-25.5H596q60 0 101.25-43.25T738.5-430q0-61-41.25-103.75T596-576.5H266.5l123 122.5-18.5 18.5-154-154L371-743l18.5 18.5-123 122.5H596q70.5 0 119.25 50.5T764-430q0 71-48.75 122T596-257H303.5Z",
        "0 -960 960 960",
        "Undo Icon"
    ),
    redo: createSvgIcon(
        "M364-257q-70.5 0-119.25-51T196-430q0-71 48.75-121.5T364-602h329.5L571-724.5l18.5-18.5L743-589.5l-153.5 154L571-454l122.5-122.5H364Z",
        "0 -960 960 960",
        "Redo Icon"
    ),
    upload: createSvgIcon(
        "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",
        "0 -960 960 960",
        "Upload Icon"
    ),
    download: createSvgIcon(
        "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",
        "0 -960 960 960",
        "Download Icon"
    ),
    image: createSvgIcon(
        "M233.76-176.5q-24.2 0-40.73-16.53-16.53-16.53-16.53-40.73v-492.48q0-24.2 16.53-40.73 16.53-16.53 40.73-16.53h492.48q24.2 0 40.73 16.53 16.53 16.53 16.53 40.73v492.48q0 24.2-16.53 40.73-16.53 16.53-40.73 16.53H233.76ZM234-202h492q12 0 22-10t10-22v-492q0-12-10-22t-22-10H234q-12 0-22 10t-10 22v492q0 12 10 22t22 10Zm88-105.5h324.5L547-440l-99 122.5-63-72-63 82ZM202-202v-556 556Z",
        "0 -960 960 960",
        "Image Icon"
    ),
    imageBroken: createSvgIcon(
        "M480-480ZM233.76-176.5q-24.2 0-40.73-16.53-16.53-16.53-16.53-40.73v-492.48q0-24.2 16.53-40.73Q209.56-783.5 234-783.5h267.5v25.5H234q-14 0-23 9t-9 23v492q0 14 9 23t23 9h492q14 0 23-9t9-23v-267.5h25.5V-234q0 24.44-16.53 40.97-16.53 16.53-40.73 16.53H233.76Zm50.24-137h392.5L556-474 437-326.5l-76-87-77 100ZM678.5-599v-79.5H599V-704h79.5v-79.5H704v79.5h79.5v25.5H704v79.5h-25.5Z",
        "0 -960 960 960",
        "Broken Image Icon"
    ),
    addImage: createSvgIcon(
        "M480-480ZM233.76-176.5q-24.2 0-40.73-16.53-16.53-16.53-16.53-40.73v-492.48q0-24.2 16.53-40.73Q209.56-783.5 234-783.5h267.5v25.5H234q-14 0-23 9t-9 23v492q0 14 9 23t23 9h492q14 0 23-9t9-23v-267.5h25.5V-234q0 24.44-16.53 40.97-16.53 16.53-40.73 16.53H233.76Zm50.24-137h392.5L556-474 437-326.5l-76-87-77 100ZM678.5-599v-79.5H599V-704h79.5v-79.5H704v79.5h79.5v25.5H704v79.5h-25.5Z",
        "0 -960 960 960",
        "Add Image Icon"
    ),
    link: createSvgIcon(
        "M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z",
        "0 -960 960 960",
        "Link Icon"
    ),
    tooltip: createSvgIcon(
        "M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
        "0 -960 960 960",
        "Tooltip Icon"
    ),
    dragHandle: createSvgIcon(
        "M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z",
        "0 -960 960 960",
        "Drag Handle Icon"
    ),
    chevronDown: createSvgIcon(
        "M480-380 308-550h344L480-380Z",
        "0 -960 960 960",
        "Chevron Down Icon"
    ),
    arrowUp: createSvgIcon(
        "m280-400 200-200 200 200H280Z",
        "0 -960 960 960",
        "Arrow Up Icon"
    ),
    arrowDown: createSvgIcon(
        "M480-360 280-560h400L480-360Z",
        "0 -960 960 960",
        "Arrow Down Icon"
    ),
    arrowLeft: createSvgIcon(
        "M560-280 360-480l200-200v400Z",
        "0 -960 960 960",
        "Arrow Left Icon"
    ),
    arrowRight: createSvgIcon(
        "M400-280v-400l200 200-200 200Z",
        "0 -960 960 960",
        "Arrow Right Icon"
    ),
    search: createSvgIcon(
        "M796-121 533-384q-35 29-79 44.5T360-324q-103 0-175.5-72.5T112-572q0-103 72.5-175.5T360-820q103 0 175.5 72.5T608-572q0 44-15.5 89T533-384l263 263-40 40ZM360-392q73 0 124.5-51.5T536-572q0-73-51.5-124.5T360-748q-73 0-124.5 51.5T184-572q0 73 51.5 124.5T360-392Z",
        "0 -960 960 960",
        "Search Icon"
    ),
    showPassword: createSvgIcon(
        "M480-360q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-520q0-33-23.5-56.5T480-600q-33 0-56.5 23.5T400-520q0 33 23.5 56.5T480-440Zm0 260q-149 0-266.5-85.5T40-520q52-126 169.5-211.5T480-825q149 0 266.5 85.5T920-520q-52 126-169.5 211.5T480-260Zm0-80q110 0 200-64.5T800-520q-48-91-138-155.5T480-740q-110 0-200 64.5T160-520q48 91 138 155.5T480-340Z",
        "0 -960 960 960",
        "Show Password Icon"
    ),
    hidePassword: createSvgIcon(
        "M480-360q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-520q0-33-23.5-56.5T480-600q-33 0-56.5 23.5T400-520q0 33 23.5 56.5T480-440Zm0 260q-149 0-266.5-85.5T40-520q52-126 169.5-211.5T480-825q149 0 266.5 85.5T920-520q-52 126-169.5 211.5T480-260Zm0-80q110 0 200-64.5T800-520q-48-91-138-155.5T480-740q-110 0-200 64.5T160-520q48 91 138 155.5T480-340Z",
        "0 -960 960 960",
        "Hide Password Icon"
    ),
    file: createSvgIcon(
        "M233.76-176.5q-24.2 0-40.73-16.53-16.53-16.53-16.53-40.73v-520q0-24.2 16.53-40.73Q209.56-794.5 234-794.5h238.48q19.72 0 37.11 8.84 17.39 8.84 29.56 21.01l111.44 111.44q12.17 12.17 21.01 29.56 8.84 17.39 8.84 37.11v384q0 24.2-16.53 40.73-16.53 16.53-40.73 16.53H233.76ZM234-202h492V-600q0-24-17-41t-41-17H518q-12 0-23.5-5.5T474-672l-98-98q-11-11-23.5-17.5T330-794H234q-12 0-22 10t-10 22v556q0 12 10 22t22 10Zm0 0v-556 556Z",
        "0 -960 960 960",
        "File Icon"
    ),
    entry: createSvgIcon(
        "M339.5-478.5h281V-504h-281v25.5Zm0 104h281V-400h-281v25.5Zm0 104.5h161v-25.5h-161v25.5Zm-65.7 133q-24.24 0-40.77-16.53-16.53-16.53-16.53-40.75v-571.44q0-24.22 16.53-40.75T274-823h312l157.5 157v471.5q0 24.44-16.53 40.97Q710.44-137 686.2-137H273.8Zm299.7-516v-144.5H274q-12 0-22 10t-10 22v571q0 12 10 22t22 10h412q12 0 22-10t10-22V-653H573.5ZM242-797.5V-653v-144.5 635-635Z",
        "0 -960 960 960",
        "Entry Icon"
    ),
    moveEntry: createSvgIcon(
        "m551.5-427.5-80 80L490-329l111.5-111L490-551.5 471.5-533l80 80h-193v25.5h193ZM194.28-217q-24.22 0-40.75-16.53T137-274.36v-411.28q0-24.3 16.53-40.83Q170.06-743 194.5-743h187l77.5 77.5h306.72q24.22 0 40.75 16.53T823-608v333.5q0 24.44-16.53 40.97Q789.94-217 765.72-217H194.28Zm.22-25.5h571q14 0 23-9t9-23V-608q0-14-9-23t-23-9H449l-77.5-77.5h-177q-14 0-23 9t-9 23v411q0 14 9 23t23 9Zm-32 0v-475 475Z",
        "0 -960 960 960",
        "Move Entry Icon"
    ),
    files: createSvgIcon(
        "M191-213.5q-24.19 0-40.84-16.66Q133.5-246.81 133.5-271v-338.5q0-23.72 16.66-40.61Q166.81-667 191-667h206.5l79.9-80h292.1q23.72 0 40.61 16.89T827-689.5V-271q0 24.19-16.89 40.84-16.89 16.66-40.61 16.66H191Zm2-213.5h228.5q13.5 0 22.75-9t9.25-23v-228L193-427Zm-34-1 213-213.5H191q-14 0-23 9.25t-9 22.75V-428Zm0 26.5V-271q0 14 9 23t23 9h578.5q13.5 0 22.75-9t9.25-23v-418.5q0-13.5-9.25-22.75t-22.75-9.25H479V-459q0 24.19-16.89 40.84-16.89 16.66-40.61 16.66H159ZM467.5-493Z",
        "0 -960 960 960",
        "Files Icon"
    ),
    folderClosed: createSvgIcon(
        "M194.28-217q-24.22 0-40.75-16.53T137-274.36v-411.28q0-24.3 16.53-40.83Q170.06-743 194.5-743h187l77.5 77.5h306.72q24.22 0 40.75 16.53T823-608v333.5q0 24.44-16.53 40.97Q789.94-217 765.72-217H194.28Zm.22-25.5h571q14 0 23-9t9-23V-608q0-14-9-23t-23-9H449l-77.5-77.5h-177q-14 0-23 9t-9 23v411q0 14 9 23t23 9Zm-32 0v-475 475Z",
        "0 -960 960 960",
        "Closed Folder Icon"
    ),
    folderOpen: createSvgIcon(
        "M188.5-217q-22.5 0-37-14.5T137-268.36v-417.28q0-22.36 17.5-39.86t40-17.5h187l77.5 77.5h306.72q15.78 0 28.03 6.75Q806-652 814-640H449l-77.5-77.5h-177q-14 0-23 9t-9 23v407q0 11 5.5 18t14.5 12l88-294h635L819-254q-5.5 17-19.5 27t-31.6 10H188.5Zm19-25.5H789L871-517H289.5l-82 274.5Zm0 0 82-274.5-82 274.5Zm-45-397.5v-77.5 77.5Z",
        "0 -960 960 960",
        "Open Folder Icon"
    ),
    status: {
        hint: createSvgIcon(
            "M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
            "0 -960 960 960",
            "Hint Icon"
        ),
        success: createSvgIcon(
            "M382-297 687-602l-45-45-259 259-124-124-45 45 169 169ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
            "0 -960 960 960",
            "Success Icon"
        ),
        error: createSvgIcon(
            "M480-480 290-670q-11-11-28-11.5t-28 11.5q-11 11-11.5 28t11.5 28L423-480 234-290q-11 11-11.5 28t11.5 28q11 11 28 11.5t28-11.5L480-423l190 190q11 11 28 11.5t28-11.5q11-11 11.5-28T730-290L537-480l190-190q11-11 11.5-28t-11.5-28q-11-11-28-11.5T670-670L480-480Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
            "0 -960 960 960",
            "Error Icon"
        ),
    },
    navigation: {
        account: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "Account Icon"
        ),
        benefits: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "Benefits Icon"
        ),
        branding: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "Branding Icon"
        ),
        history: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "History Icon"
        ),
        jobs: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "Jobs Icon"
        ),
        logOut: createSvgIcon(
            "M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5",
            "0 0 16 16",
            "Log Out Icon"
        ),
    },
};

export type IconName = Exclude<ExtractPaths<typeof iconMap>, ''>;