<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { findLink } from './navigation'
import { availableLocales, setLocale } from '@/i18n'
import { initials } from '@/utils/helpers'
import Icon from '@/components/ui/Icon.vue'
import Button from '@/components/ui/Button.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DropdownItem from '@/components/ui/DropdownItem.vue'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

defineEmits(['logout'])

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const products = useProductsStore()
const settings = useSettingsStore()
const theme = useThemeStore()
const { t, locale } = useI18n()

const themeModes = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'monitor' }
]

const pageTitle = computed(() => {
  const link = findLink(route.path)
  return link ? t(link.labelKey) : t('app.name')
})

const alerts = computed(() => [...products.outOfStock, ...products.lowStock].slice(0, 6))

const go = (path) => router.push(path)

const changeLocale = (code) => {
  setLocale(code)
  ui.notify(code === 'km' ? 'ប្តូរភាសាជាខ្មែរ' : 'Language changed to English')
}
</script>

<template>
  <header
    class="h-16 shrink-0 backdrop-blur-xl flex items-center gap-2 px-3 sm:px-5 sticky top-0 z-30
           border-b border-slate-200/70 dark:border-slate-800"
    :style="{ background: 'color-mix(in srgb, var(--c-navbar) 88%, transparent)' }"
  >
    <!-- Desktop: sidebar collapse. Mobile: brand mark (nav lives in the tab bar). -->
    <button
      class="hidden lg:grid w-9 h-9 place-items-center rounded-xl text-slate-500 transition
             hover:text-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :style="{ background: 'var(--c-field-fill)' }"
      title="Toggle sidebar"
      aria-label="Toggle sidebar"
      @click="ui.toggleSidebar()"
    >
      <Icon
        name="chevronRight"
        size="w-[18px] h-[18px]"
        class="transition-transform duration-300"
        :class="ui.sidebarCollapsed ? '' : 'rotate-180'"
      />
    </button>

    <span
      class="lg:hidden w-9 h-9 grid place-items-center rounded-xl text-white shrink-0 overflow-hidden"
      :style="{ background: 'var(--c-primary)' }"
      aria-hidden="true"
    >
      <img v-if="settings.logo" :src="settings.logo" alt="" class="w-full h-full object-cover" />
      <Icon v-else name="store" size="w-[18px] h-[18px]" />
    </span>

    <div class="min-w-0 ml-0.5 lg:ml-1">
      <h2 class="text-[15px] font-semibold text-slate-900 dark:text-white truncate leading-tight">
        {{ pageTitle }}
      </h2>
      <p class="lg:hidden text-[11px] text-slate-400 truncate leading-tight">
        {{ settings.store }}
      </p>
    </div>

    <div class="ml-auto flex items-center gap-1.5">
      <!-- New sale: full label ≥md, icon-only below so it never disappears -->
      <template v-if="route.path !== '/pos' && auth.can('usePos')">
        <Button class="hidden md:inline-flex" icon="pos" @click="go('/pos')">
          {{ t('pos.newSale') }}
        </Button>
        <button
          class="md:hidden w-9 h-9 grid place-items-center rounded-xl text-white shrink-0 transition
                 hover:brightness-95 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
          :style="{ background: 'var(--c-primary)' }"
          :aria-label="t('pos.newSale')"
          :title="t('pos.newSale')"
          @click="go('/pos')"
        >
          <Icon name="pos" size="w-[18px] h-[18px]" />
        </button>
      </template>

      <!-- Global display currency -->
      <CurrencySwitcher />

      <span class="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <!-- Language -->
      <LanguageSwitcher size="sm" />

      <!-- Theme mode: quick toggle + explicit Light / Dark / System -->
      <button
        class="icon-btn"
        :title="theme.isDark ? t('settings.lightMode') : t('settings.darkMode')"
        @click="theme.toggleMode()"
      >
        <Transition name="fade" mode="out-in">
          <Icon :key="theme.isDark ? 'sun' : 'moon'" :name="theme.isDark ? 'sun' : 'moon'" />
        </Transition>
      </button>

      <Dropdown variant="plain" size="sm" width="w-48" class="hidden sm:inline-block">
        <template #trigger>
          <Icon name="palette" size="w-4 h-4" />
        </template>
        <p class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {{ t('settings.theme') }}
        </p>
        <DropdownItem
          v-for="m in themeModes"
          :key="m.value"
          :icon="m.icon"
          :active="theme.mode === m.value"
          @click="theme.setMode(m.value)"
        >
          {{ m.label }}
        </DropdownItem>
        <div class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
        <DropdownItem icon="sliders" @click="go('/settings?tab=appearance')">
          {{ t('settings.appearance') }}
        </DropdownItem>
      </Dropdown>

      <!-- Alerts -->
      <Dropdown variant="plain" size="sm" width="w-72">
        <template #trigger>
          <span class="relative inline-flex">
            <Icon name="bell" />
            <span
              v-if="alerts.length"
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"
            />
          </span>
        </template>
        <p class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {{ t('dashboard.lowStockAlert') }}
        </p>
        <DropdownItem v-for="product in alerts" :key="product.id" @click="go('/inventory')">
          <span class="flex items-center justify-between gap-2 w-full">
            <span class="truncate">{{ product.name }}</span>
            <span class="text-xs font-bold" :class="product.stock <= 0 ? 'text-rose-500' : 'text-amber-500'">
              {{ product.stock }}
            </span>
          </span>
        </DropdownItem>
        <p v-if="!alerts.length" class="px-3 py-6 text-center text-sm text-slate-400">
          {{ t('common.noData') }}
        </p>
      </Dropdown>

      <!-- Profile -->
      <Dropdown variant="plain" size="sm" width="w-56">
        <template #trigger>
          <span
            class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold"
          >
            {{ initials(auth.user?.name) }}
          </span>
          <span class="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
            {{ auth.user?.name?.split(' ')[0] }}
          </span>
        </template>

        <div class="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ auth.user?.name }}</p>
          <p class="text-xs text-slate-400">{{ auth.user?.email }}</p>
        </div>
        <DropdownItem icon="gear" @click="go('/settings')">{{ t('nav.settings') }}</DropdownItem>
        <DropdownItem icon="shield" @click="go('/users')">{{ t('nav.users') }}</DropdownItem>
        <div class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
        <DropdownItem icon="logout" danger @click="$emit('logout')">{{ t('auth.signOut') }}</DropdownItem>
      </Dropdown>
    </div>
  </header>
</template>
