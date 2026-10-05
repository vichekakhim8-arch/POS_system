<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { navigation, mobileTabsFor } from './navigation'
import { initials } from '@/utils/helpers'

const emit = defineEmits(['logout'])

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const theme = useThemeStore()
const { t } = useI18n()

const moreOpen = ref(false)

/** Tabs adapt to the signed-in role — every role gets a usable bar. */
const tabs = computed(() => mobileTabsFor(auth.can))

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)

/** Everything not already on the bar, grouped, filtered by ability. */
const moreGroups = computed(() => {
  const onBar = tabs.value.map((tab) => tab.to)
  return navigation
    .map((group) => ({
      ...group,
      links: group.links.filter((l) => auth.can(l.ability) && !onBar.includes(l.to))
    }))
    .filter((group) => group.links.length)
})

const moreActive = computed(() =>
  moreGroups.value.some((group) => group.links.some((l) => isActive(l.to)))
)

const go = (path) => {
  moreOpen.value = false
  router.push(path)
}

watch(() => route.fullPath, () => (moreOpen.value = false))
watch(moreOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <!-- ══════════════ Bottom tab bar ══════════════ -->
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t pb-safe backdrop-blur-xl"
    :style="{
      background: 'color-mix(in srgb, var(--c-navbar) 94%, transparent)',
      borderColor: 'var(--c-border)'
    }"
    aria-label="Primary"
  >
    <div class="grid" :style="{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="relative flex flex-col items-center justify-center gap-1 h-[58px] transition-colors"
        :style="{ color: isActive(tab.to) ? 'var(--c-primary)' : 'var(--c-muted)' }"
      >
        <span
          v-if="isActive(tab.to)"
          class="absolute top-0 w-9 h-[3px] rounded-b-full"
          :style="{ background: 'var(--c-primary)' }"
        />
        <span class="relative">
          <Icon :name="tab.icon" size="w-[19px] h-[19px]" />
          <span
            v-if="tab.badge && cart.count"
            class="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px]
                   font-bold grid place-items-center text-white tabular-nums"
            :style="{ background: 'var(--c-primary)' }"
          >
            {{ cart.count }}
          </span>
        </span>
        <span class="text-[10px] font-medium truncate max-w-[70px]">{{ t(tab.labelKey) }}</span>
      </RouterLink>

      <button
        type="button"
        class="relative flex flex-col items-center justify-center gap-1 h-[58px] transition-colors"
        :style="{ color: moreOpen || moreActive ? 'var(--c-primary)' : 'var(--c-muted)' }"
        :aria-expanded="moreOpen"
        aria-label="More"
        @click="moreOpen = true"
      >
        <span
          v-if="moreActive"
          class="absolute top-0 w-9 h-[3px] rounded-b-full"
          :style="{ background: 'var(--c-primary)' }"
        />
        <Icon name="menu" size="w-[19px] h-[19px]" />
        <span class="text-[10px] font-medium">More</span>
      </button>
    </div>
  </nav>

  <!-- ══════════════ "More" bottom sheet ══════════════ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="moreOpen" class="lg:hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="moreOpen = false" />

        <Transition
          appear
          enter-active-class="transition-transform duration-250 ease-out"
          enter-from-class="translate-y-full"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-to-class="translate-y-full"
        >
          <div
            class="absolute inset-x-0 bottom-0 max-h-[86dvh] flex flex-col pb-safe"
            :style="{
              background: 'var(--c-card)',
              borderTopLeftRadius: 'var(--radius-3xl)',
              borderTopRightRadius: 'var(--radius-3xl)'
            }"
            role="dialog"
            aria-label="All sections"
          >
            <div class="flex justify-center pt-2.5 shrink-0">
              <span class="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <!-- account header -->
            <header class="flex items-center gap-3 px-5 py-3.5 shrink-0">
              <span
                class="w-10 h-10 rounded-full grid place-items-center text-[12px] font-bold text-white shrink-0"
                :style="{ background: 'var(--c-primary)' }"
              >
                {{ initials(auth.user?.name) }}
              </span>
              <div class="min-w-0 grow">
                <p class="text-[14px] font-semibold text-slate-900 dark:text-white truncate">
                  {{ auth.user?.name }}
                </p>
                <p class="text-[11.5px] text-slate-400 truncate">
                  {{ auth.role }} · {{ settings.store }}
                </p>
              </div>
              <button
                class="w-9 h-9 grid place-items-center rounded-xl text-slate-400 shrink-0"
                :style="{ background: 'var(--c-subtle)' }"
                aria-label="Close"
                @click="moreOpen = false"
              >
                <Icon name="x" size="w-4 h-4" />
              </button>
            </header>

            <div class="h-px shrink-0" :style="{ background: 'var(--c-border)' }" />

            <!-- navigation groups -->
            <div class="grow overflow-y-auto px-4 py-4 space-y-5">
              <section v-for="group in moreGroups" :key="group.id">
                <p class="t-micro text-slate-400 px-1 mb-2">{{ t(group.labelKey) }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="link in group.links"
                    :key="link.to"
                    type="button"
                    class="flex items-center gap-2.5 px-3 h-12 rounded-xl text-left transition active:scale-[.98]"
                    :style="
                      isActive(link.to)
                        ? {
                            background: 'color-mix(in srgb, var(--c-primary) 11%, transparent)',
                            color: 'var(--c-primary)'
                          }
                        : { background: 'var(--c-subtle)', color: 'var(--c-text)' }
                    "
                    @click="go(link.to)"
                  >
                    <Icon :name="link.icon" size="w-[18px] h-[18px] shrink-0" />
                    <span class="text-[13px] font-medium truncate">{{ t(link.labelKey) }}</span>
                  </button>
                </div>
              </section>

              <p v-if="!moreGroups.length" class="text-center text-sm text-slate-400 py-8">
                You have access to everything on the tab bar.
              </p>
            </div>

            <!-- preferences -->
            <footer class="shrink-0 border-t px-4 py-3 space-y-2" :style="{ borderColor: 'var(--c-border)' }">
              <div class="flex items-center gap-2">
                <LanguageSwitcher variant="segmented" />
                <button
                  type="button"
                  class="w-11 h-11 grid place-items-center rounded-xl text-slate-500 shrink-0"
                  :style="{ background: 'var(--c-subtle)' }"
                  :aria-label="theme.isDark ? 'Light mode' : 'Dark mode'"
                  @click="theme.toggleMode()"
                >
                  <Icon :name="theme.isDark ? 'sun' : 'moon'" size="w-[18px] h-[18px]" />
                </button>
                <button
                  type="button"
                  class="grow h-11 rounded-xl text-[13px] font-semibold inline-flex items-center
                         justify-center gap-2 transition active:scale-[.98]"
                  :style="{
                    background: 'color-mix(in srgb, var(--c-danger) 11%, transparent)',
                    color: 'var(--c-danger)'
                  }"
                  @click="moreOpen = false; emit('logout')"
                >
                  <Icon name="logout" size="w-4 h-4" />
                  {{ t('auth.signOut') }}
                </button>
              </div>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
