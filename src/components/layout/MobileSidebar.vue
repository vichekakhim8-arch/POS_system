<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SidebarNav from './SidebarNav.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { initials } from '@/utils/helpers'
import Icon from '@/components/ui/Icon.vue'

defineEmits(['logout'])

const route = useRoute()
const ui = useUiStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const { t } = useI18n()

watch(() => route.fullPath, () => ui.closeMobileSidebar())
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.mobileSidebarOpen" class="lg:hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="ui.closeMobileSidebar()" />

        <Transition
          appear
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="-translate-x-full"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-to-class="-translate-x-full"
        >
          <aside
            class="absolute inset-y-0 left-0 w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
          >
            <div class="h-16 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800">
              <span
                class="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center overflow-hidden"
              >
                <img v-if="settings.logo" :src="settings.logo" alt="" class="w-full h-full object-cover" />
                <Icon v-else name="store" />
              </span>
              <div class="min-w-0">
                <p class="font-bold text-slate-900 dark:text-white truncate">{{ settings.store }}</p>
                <p class="text-[10px] text-slate-400">{{ t('app.tagline') }}</p>
              </div>
              <button class="ml-auto icon-btn" @click="ui.closeMobileSidebar()">
                <Icon name="x" size="w-4 h-4" />
              </button>
            </div>

            <SidebarNav :collapsed="false" />

            <div class="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
              <span
                class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold"
              >
                {{ initials(auth.user?.name) }}
              </span>
              <div class="min-w-0 grow">
                <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {{ auth.user?.name }}
                </p>
                <p class="text-xs text-slate-400">{{ auth.role }}</p>
              </div>
              <button class="icon-btn-danger" @click="$emit('logout')">
                <Icon name="logout" size="w-4 h-4" />
              </button>
            </div>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
