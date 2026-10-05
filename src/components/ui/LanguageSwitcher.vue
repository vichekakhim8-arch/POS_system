<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import { availableLocales, setLocale } from '@/i18n'
import { useUiStore } from '@/stores/ui'

/**
 * Global language switcher.
 * `segmented` → inline pill pair (login, settings)
 * `dropdown`  → compact menu (navbar)
 */
const props = defineProps({
  variant: { type: String, default: 'dropdown' },
  size: { type: String, default: 'md' }
})

const { locale } = useI18n()
const ui = useUiStore()

const open = ref(false)
const root = ref(null)

const active = computed(
  () => availableLocales.find((l) => l.code === locale.value) || availableLocales[0]
)

const choose = (code) => {
  open.value = false
  if (code === locale.value) return
  setLocale(code)
  ui.notify(code === 'km' ? 'ប្តូរទៅភាសាខ្មែរ' : 'Switched to English')
}

const onOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
const onKey = (e) => e.key === 'Escape' && (open.value = false)

onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutside)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <!-- ══════════════ Segmented (login / settings) ══════════════ -->
  <div
    v-if="variant === 'segmented'"
    class="inline-flex p-1 gap-1 border border-slate-200 dark:border-slate-700 bg-surface-subtle"
    :style="{ borderRadius: 'var(--radius-xl)' }"
    role="group"
    aria-label="Select language"
  >
    <button
      v-for="item in availableLocales"
      :key="item.code"
      type="button"
      class="inline-flex items-center gap-2 px-3 h-9 text-[13px] font-semibold transition-all duration-200
             focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :class="
        locale === item.code
          ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
      "
      :style="{ borderRadius: 'var(--radius-lg)' }"
      :aria-pressed="locale === item.code"
      @click="choose(item.code)"
    >
      <span class="w-5 h-5 rounded-full overflow-hidden ring-1 ring-black/5 shrink-0 grid place-items-center text-[11px] leading-none bg-white">
        {{ item.flag }}
      </span>
      <span>{{ item.short }}</span>
    </button>
  </div>

  <!-- ══════════════ Dropdown (navbar) ══════════════ -->
  <div v-else ref="root" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700
             text-slate-700 dark:text-slate-200 transition hover:border-brand-400 hover:text-brand-600
             active:scale-[.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :class="size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-2.5 py-2 text-sm'"
      :style="{ borderRadius: 'var(--radius-xl)', background: 'var(--c-card)' }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="`Language: ${active.label}`"
      @click="open = !open"
    >
      <span class="w-5 h-5 rounded-full overflow-hidden ring-1 ring-black/5 shrink-0 grid place-items-center text-[11px] leading-none bg-white">
        {{ active.flag }}
      </span>
      <span class="hidden sm:inline font-semibold">{{ active.short }}</span>
      <Icon
        name="chevronRight"
        size="w-3.5 h-3.5"
        class="opacity-60 transition-transform duration-200"
        :class="open ? '-rotate-90' : 'rotate-90'"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[.98]"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 -translate-y-1 scale-[.98]"
    >
      <ul
        v-if="open"
        class="absolute right-0 mt-2 w-52 z-50 p-1.5 border border-slate-200 dark:border-slate-700 shadow-xl"
        :style="{ background: 'var(--c-card)', borderRadius: 'var(--radius-2xl)' }"
        role="listbox"
      >
        <li class="px-2.5 pt-1.5 pb-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Language</p>
        </li>
        <li v-for="item in availableLocales" :key="item.code">
          <button
            type="button"
            role="option"
            :aria-selected="locale === item.code"
            class="w-full flex items-center gap-3 px-2.5 py-2.5 text-left transition
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            :class="
              locale === item.code
                ? 'bg-brand-50 dark:bg-brand-500/10'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            "
            :style="{ borderRadius: 'var(--radius-xl)' }"
            @click="choose(item.code)"
          >
            <span class="w-6 h-6 rounded-full overflow-hidden ring-1 ring-black/5 shrink-0 grid place-items-center text-sm leading-none bg-white">
              {{ item.flag }}
            </span>
            <span class="min-w-0 grow">
              <span
                class="block text-sm font-semibold truncate"
                :class="locale === item.code ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'"
              >
                {{ item.label }}
              </span>
              <span class="block text-[11px] text-slate-400">{{ item.native }}</span>
            </span>
            <Icon v-if="locale === item.code" name="check" size="w-4 h-4" class="text-brand-600 shrink-0" />
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>
