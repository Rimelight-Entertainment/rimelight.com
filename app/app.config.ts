export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'amber',
      tertiary: 'tertiary',
      info: 'sky',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      neutral: 'slate'
    },
    icons: {
      close: 'lucide:x',
      chevronLeft: 'lucide:chevron-left',
      chevronRight: 'lucide:chevron-right',
    },
    banner: {
      slots: {
        icon: 'text-highlighted',
        title: 'text-highlighted',
        close: 'text-highlighted'
      }
    },
    page: {
      slots: {
        root: 'lg:gap-6',
      }
    },
    pageCTA: {
      slots: {
        root: 'rounded-none'
      }
    },
    contentToc: {
      defaultVariants: {
        highlight: true,
        highlightColor: 'primary'
      }
    },
    tooltip: {
      defaultVariants: {
        arrow: true
      }
    },
    dropdownMenu: {
      defaultVariants: {
        arrow: true
      }
    },
    dashboardSidebar: {
      slots: {
        root: 'pb-16',
        header: 'border-b border-default',
        footer: 'border-t border-default'
      },
      defaultVariants: {
        resizable: true,
        collapsible: true,
      }
    }
  }
})