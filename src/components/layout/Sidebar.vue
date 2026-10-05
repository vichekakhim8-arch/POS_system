<script setup>
import { useI18n } from 'vue-i18n'
import SidebarNav from './SidebarNav.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { initials } from '@/utils/helpers'
import Icon from '@/components/ui/Icon.vue'

defineEmits(['logout'])

const ui = useUiStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <aside
    class="hidden lg:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 transition-[width] duration-300 ease-in-out"
    :style="{ background: 'var(--c-sidebar)' }"
    :class="ui.sidebarCollapsed ? 'w-[78px]' : 'w-[264px]'"
  >
    <!-- Brand -->
    <div class="h-16 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <span
        class="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm shadow-brand-600/30"
      >
        <img v-if="settings.logo" :src="settings.logo" alt="" class="w-full h-full object-cover" />
        <Icon v-else name="store" />
      </span>
      <div
        class="overflow-hidden transition-all duration-300"
        :class="ui.sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
      >
        <p class="font-bold text-slate-900 dark:text-white tracking-tight leading-tight whitespace-nowrap">
          {{ settings.store || t('app.name') }}
        </p>
        <p class="text-[10px] text-slate-400 whitespace-nowrap">{{ t('app.tagline') }}</p>
      </div>
    </div>

    <SidebarNav :collapsed="ui.sidebarCollapsed" />

    <!-- Profile -->
    <div class="border-t border-slate-200 dark:border-slate-800 p-3 shrink-0">
      <div
        class="flex items-center gap-3 p-2 rounded-xl transition hover:bg-slate-50 dark:hover:bg-slate-800"
        :class="ui.sidebarCollapsed ? 'justify-center' : ''"
      >
        <span
          class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold shrink-0"
        >
          {{ initials(auth.user?.name) }}
        </span>
        <div v-if="!ui.sidebarCollapsed" class="min-w-0 grow">
          <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {{ auth.user?.name }}
          </p>
          <p class="text-xs text-slate-400">{{ auth.role }}</p>
        </div>
        <button
          v-if="!ui.sidebarCollapsed"
          class="icon-btn-danger"
          :title="t('auth.signOut')"
          @click="$emit('logout')"
        >
          <Icon name="logout" size="w-4 h-4" />
        </button>
      </div>
      <button
        v-if="ui.sidebarCollapsed"
        class="w-full flex justify-center icon-btn-danger mt-1"
        :title="t('auth.signOut')"
        @click="$emit('logout')"
      >
        <Icon name="logout" size="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>
