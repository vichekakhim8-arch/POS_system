<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ColorField from './ColorField.vue'
import ThemePresets from './ThemePresets.vue'
import ThemePreview from './ThemePreview.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import ThemeModeToggle from '@/components/ui/ThemeModeToggle.vue'
import { BUTTON_STYLES, RADIUS_OPTIONS, useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'

const theme = useThemeStore()
const ui = useUiStore()
const { t } = useI18n()

/** Saved baseline so "Reset" can revert unsaved experiments. */
const baseline = ref(theme.snapshot())
const openGroup = ref('brand')

const groups = computed(() => [
  {
    id: 'brand',
    title: 'Brand',
    icon: 'sparkles',
    fields: [
      { key: 'primary', label: 'Primary color', hint: 'Buttons, links, active states' },
      { key: 'secondary', label: 'Secondary color' },
      { key: 'accent', label: 'Accent color' }
    ]
  },
  {
    id: 'background',
    title: 'Background',
    icon: 'layers',
    surface: true,
    fields: [
      { key: 'background', label: 'Main background' },
      { key: 'card', label: 'Card background' },
      { key: 'subtle', label: 'Subtle surface' },
      { key: 'sidebar', label: 'Sidebar background' },
      { key: 'navbar', label: 'Navbar background' }
    ]
  },
  {
    id: 'text',
    title: 'Text',
    icon: 'edit',
    surface: true,
    fields: [
      { key: 'heading', label: 'Heading text' },
      { key: 'text', label: 'Primary text' },
      { key: 'secondaryText', label: 'Secondary text' },
      { key: 'mutedText', label: 'Muted text' }
    ]
  },
  {
    id: 'ui',
    title: 'UI elements',
    icon: 'sliders',
    fields: [
      { key: 'buttonBackground', label: 'Button background', auto: 'primary' },
      { key: 'buttonText', label: 'Button text', auto: 'auto contrast' },
      { key: 'linkColor', label: 'Link color', auto: 'primary' }
    ],
    surfaceFields: [
      { key: 'border', label: 'Border color' },
      { key: 'input', label: 'Input background' },
      { key: 'inputBorder', label: 'Input border' }
    ]
  },
  {
    id: 'status',
    title: 'Status',
    icon: 'alert',
    fields: [
      { key: 'success', label: 'Success' },
      { key: 'warning', label: 'Warning' },
      { key: 'danger', label: 'Danger' },
      { key: 'info', label: 'Info' }
    ]
  },
  {
    id: 'pos',
    title: 'POS screen',
    icon: 'pos',
    fields: [
      { key: 'posActiveCategory', label: 'Active category', auto: 'primary' },
      { key: 'posSelectedProduct', label: 'Selected product', auto: 'primary' },
      { key: 'posCartHighlight', label: 'Cart highlight', auto: 'surface' },
      { key: 'posDiscount', label: 'Discount' },
      { key: 'posPaymentSuccess', label: 'Payment success' }
    ]
  },
  {
    id: 'menu',
    title: 'Customer menu & website',
    icon: 'globe',
    fields: [
      { key: 'menuHeader', label: 'Menu header', auto: 'primary' },
      { key: 'menuActiveCategory', label: 'Active category', auto: 'primary' },
      { key: 'menuProductButton', label: 'Product button', auto: 'primary' },
      { key: 'menuPrice', label: 'Price', auto: 'secondary' },
      { key: 'menuPromotion', label: 'Promotion' },
      { key: 'menuCheckout', label: 'Checkout button' }
    ]
  }
])

const valueOf = (field, surface) =>
  surface ? theme.surfaces[field.key] : theme[field.key] || theme.resolved[fallbackKey(field.key)] || theme.primary

const fallbackKey = (key) =>
  ({
    buttonBackground: 'buttonBackground',
    buttonText: 'buttonText',
    linkColor: 'link',
    posActiveCategory: 'posActiveCategory',
    posSelectedProduct: 'posSelectedProduct',
    posCartHighlight: 'posCartHighlight',
    menuHeader: 'menuHeader',
    menuActiveCategory: 'menuActiveCategory',
    menuProductButton: 'menuProductButton',
    menuPrice: 'menuPrice'
  })[key] || key

const update = (field, value, surface) => {
  const ok = surface ? theme.setSurface(field.key, value) : theme.setColor(field.key, value)
  if (!ok) ui.notify('Enter a valid HEX color, e.g. #2563EB', 'error')
}

const reset = (field, surface) => {
  surface ? theme.resetSurface(field.key) : theme.resetColor(field.key)
}

const save = () => {
  theme.persist()
  baseline.value = theme.snapshot()
  ui.notify('Theme saved and applied across the system')
}

const revert = () => {
  theme.restore(baseline.value)
  ui.notify('Unsaved changes reverted')
}

const resetAll = () => {
  theme.resetAll()
  baseline.value = theme.snapshot()
  ui.notify('Theme reset to factory defaults')
}

const failing = computed(() => theme.contrastReport.filter((c) => !c.ok))
</script>

<template>
  <div class="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
    <!-- ------------------------------------------------------- controls -->
    <div class="space-y-5 min-w-0">
      <!-- mode + shape -->
      <section class="card p-5 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="palette" size="w-4 h-4" class="text-brand-600" /> Theme mode
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Your brand colour stays identical in light and dark.
            </p>
          </div>
          <ThemeModeToggle />
        </div>

        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <p class="label">Border radius</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="option in RADIUS_OPTIONS"
                :key="option.value"
                class="px-3 py-2 text-xs font-semibold border transition"
                :class="
                  theme.borderRadius === option.value
                    ? 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'
                "
                :style="{ borderRadius: 'var(--radius-xl)' }"
                @click="theme.setRadius(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div>
            <p class="label">Button style</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="option in BUTTON_STYLES"
                :key="option.value"
                class="px-4 py-2 text-xs font-semibold border transition"
                :class="
                  theme.buttonStyle === option.value
                    ? 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'
                "
                :style="{ borderRadius: option.radius }"
                @click="theme.setButtonStyle(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- presets -->
      <section class="card p-5">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-1">Theme presets</h3>
        <p class="text-xs text-slate-400 mb-4">Apply a professional palette instantly.</p>
        <ThemePresets />
      </section>

      <!-- colour groups -->
      <section class="card overflow-hidden">
        <header class="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 class="font-semibold text-slate-900 dark:text-white">Colour customisation</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Editing surfaces applies to <b class="uppercase">{{ theme.isDark ? 'dark' : 'light' }}</b> mode.
          </p>
        </header>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <div v-for="group in groups" :key="group.id">
            <button
              class="w-full flex items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              @click="openGroup = openGroup === group.id ? '' : group.id"
            >
              <span
                class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0"
              >
                <Icon :name="group.icon" size="w-4 h-4" />
              </span>
              <span class="grow text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ group.title }}
              </span>
              <Icon
                name="chevronRight"
                size="w-4 h-4"
                class="text-slate-400 transition-transform duration-300"
                :class="openGroup === group.id ? 'rotate-90' : ''"
              />
            </button>

            <div
              class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
              :style="{
                gridTemplateRows: openGroup === group.id ? '1fr' : '0fr',
                opacity: openGroup === group.id ? 1 : 0
              }"
            >
              <div class="overflow-hidden">
                <div class="px-5 pb-4 divide-y divide-slate-100 dark:divide-slate-800">
                  <ColorField
                    v-for="field in group.fields"
                    :key="field.key"
                    :label="field.label"
                    :hint="field.hint || (field.auto && !theme[field.key] ? `Auto · follows ${field.auto}` : '')"
                    :model-value="valueOf(field, group.surface)"
                    @update:model-value="update(field, $event, group.surface)"
                    @reset="reset(field, group.surface)"
                  />
                  <ColorField
                    v-for="field in group.surfaceFields || []"
                    :key="`s-${field.key}`"
                    :label="field.label"
                    :model-value="theme.surfaces[field.key]"
                    @update:model-value="update(field, $event, true)"
                    @reset="reset(field, true)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- accessibility -->
      <section class="card p-5">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="shield" size="w-4 h-4" class="text-brand-600" /> Accessibility check
          </h3>
          <span
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold"
            :class="
              failing.length
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
            "
          >
            {{ failing.length ? `${failing.length} to review` : 'All readable' }}
          </span>
        </div>
        <ul class="space-y-2">
          <li
            v-for="check in theme.contrastReport"
            :key="check.label"
            class="flex items-center gap-2 text-sm"
          >
            <Icon
              :name="check.ok ? 'check' : 'alert'"
              size="w-4 h-4"
              :class="check.ok ? 'text-emerald-500' : 'text-amber-500'"
            />
            <span class="grow text-slate-600 dark:text-slate-300">{{ check.label }}</span>
            <span class="font-mono text-xs text-slate-400">{{ check.ratio }}:1</span>
            <span
              class="w-16 text-right text-[11px] font-bold"
              :class="check.ok ? 'text-emerald-600' : 'text-amber-600'"
            >
              {{ check.level }}
            </span>
          </li>
        </ul>
      </section>
    </div>

    <!-- -------------------------------------------------------- preview -->
    <div class="xl:sticky xl:top-4 space-y-4 min-w-0">
      <section class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="eye" size="w-4 h-4" class="text-brand-600" /> Live preview
          </h3>
          <span class="text-[11px] font-semibold text-slate-400 uppercase">
            {{ theme.isDark ? 'Dark' : 'Light' }}
          </span>
        </div>
        <ThemePreview />
      </section>

      <div class="flex flex-col sm:flex-row gap-2">
        <Button variant="ghost" icon="refresh" class="sm:flex-1" @click="resetAll">Reset all</Button>
        <Button variant="secondary" class="sm:flex-1" @click="revert">Undo changes</Button>
        <Button icon="check" class="sm:flex-1" @click="save">{{ t('common.saveChanges') }}</Button>
      </div>

      <p class="text-[11px] text-slate-400 text-center px-2">
        Changes apply instantly across Dashboard, POS, Products, Orders, Reports, Customer Menu and
        the public website. Saved to this device and ready to sync per restaurant.
      </p>
    </div>
  </div>
</template>
