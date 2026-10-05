<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { useCurrencyStore } from '@/stores/currency'
import { useUiStore } from '@/stores/ui'

/**
 * Global display-currency switcher.
 * Desktop/tablet → anchored dropdown. Mobile → touch-friendly bottom sheet.
 */
const props = defineProps({
  /** 'auto' uses a dropdown ≥ sm and a bottom sheet below sm */
  variant: { type: String, default: 'auto' },
  compact: { type: Boolean, default: false }
})

const currency = useCurrencyStore()
const ui = useUiStore()

const open = ref(false)
const isSmall = ref(false)
const root = ref(null)
const panel = ref(null)
const optionRefs = ref([])
const activeIndex = ref(0)

const useSheet = computed(() => props.variant === 'sheet' || (props.variant === 'auto' && isSmall.value))

const syncViewport = () => {
  isSmall.value = window.matchMedia('(max-width: 639px)').matches
}

const close = () => {
  open.value = false
  activeIndex.value = currency.list.findIndex((c) => c.code === currency.code)
}

const toggle = async () => {
  open.value = !open.value
  if (!open.value) return
  activeIndex.value = Math.max(0, currency.list.findIndex((c) => c.code === currency.code))
  await nextTick()
  optionRefs.value[activeIndex.value]?.focus()
}

const select = (code) => {
  if (code !== currency.code) {
    currency.setCurrency(code)
    const picked = currency.list.find((c) => c.code === code)
    ui.notify(`Display currency: ${picked.code} — ${picked.name}`)
  }
  close()
}

/* -------------------------------------------------- keyboard navigation */
const focusOption = async (index) => {
  const total = currency.list.length
  activeIndex.value = (index + total) % total
  await nextTick()
  optionRefs.value[activeIndex.value]?.focus()
}

const onKeydown = (event) => {
  if (!open.value) {
    if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      toggle()
    }
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    root.value?.querySelector('button')?.focus()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusOption(activeIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusOption(activeIndex.value - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusOption(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusOption(currency.list.length - 1)
  } else if (event.key === 'Tab') {
    close()
  }
}

const onPointerDown = (event) => {
  if (root.value && !root.value.contains(event.target) && !panel.value?.contains(event.target)) close()
}

watch(open, (value) => {
  if (useSheet.value) document.body.style.overflow = value ? 'hidden' : ''
})

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
  document.addEventListener('mousedown', onPointerDown)
  document.addEventListener('touchstart', onPointerDown, { passive: true })
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('resize', syncViewport)
  document.removeEventListener('mousedown', onPointerDown)
  document.removeEventListener('touchstart', onPointerDown)
})
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <!-- Trigger -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 border transition active:scale-[.98]
             border-slate-200 dark:border-slate-700 hover:border-brand-400
             text-slate-700 dark:text-slate-200 hover:text-brand-600
             focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :class="compact ? 'px-2 py-1.5 text-xs' : 'px-2.5 sm:px-3 py-2 text-sm'"
      :style="{ borderRadius: 'var(--radius-xl)', background: 'var(--c-card)' }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="`Display currency: ${currency.active.name}`"
      @click="toggle"
    >
      <span class="text-base leading-none" aria-hidden="true">{{ currency.active.flag }}</span>
      <span class="font-semibold tracking-tight">{{ currency.active.code }}</span>
      <span class="text-slate-400 font-medium hidden sm:inline" aria-hidden="true">
        {{ currency.active.symbol }}
      </span>
      <Icon
        name="chevronRight"
        size="w-3.5 h-3.5"
        class="opacity-60 transition-transform duration-200"
        :class="open ? '-rotate-90' : 'rotate-90'"
      />
    </button>

    <!-- Desktop / tablet dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[.98]"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 -translate-y-1 scale-[.98]"
    >
      <div
        v-if="open && !useSheet"
        ref="panel"
        role="listbox"
        aria-label="Select display currency"
        class="absolute right-0 mt-2 w-64 z-50 overflow-hidden border shadow-xl
               border-slate-200 dark:border-slate-700"
        :style="{ background: 'var(--c-card)', borderRadius: 'var(--radius-2xl)' }"
      >
        <header class="px-4 pt-3 pb-2">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">Currency</p>
          <p class="text-[11px] text-slate-400">Display currency</p>
        </header>

        <div class="h-px bg-slate-100 dark:bg-slate-800" />

        <ul class="p-1.5">
          <li v-for="(item, index) in currency.list" :key="item.code">
            <button
              :ref="(el) => (optionRefs[index] = el)"
              type="button"
              role="option"
              :aria-selected="item.code === currency.code"
              class="w-full flex items-center gap-3 px-2.5 py-2.5 text-left transition
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              :class="
                item.code === currency.code
                  ? 'bg-brand-50 dark:bg-brand-500/10'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              "
              :style="{ borderRadius: 'var(--radius-xl)' }"
              @click="select(item.code)"
            >
              <span class="text-xl leading-none shrink-0" aria-hidden="true">{{ item.flag }}</span>
              <span class="min-w-0 grow">
                <span
                  class="block text-sm font-semibold truncate"
                  :class="item.code === currency.code ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'"
                >
                  {{ item.code }}
                </span>
                <span class="block text-[11px] text-slate-400 truncate">{{ item.name }}</span>
              </span>
              <span class="text-sm font-semibold text-slate-400 shrink-0" aria-hidden="true">
                {{ item.symbol }}
              </span>
              <Icon
                v-if="item.code === currency.code"
                name="check"
                size="w-4 h-4"
                class="text-brand-600 shrink-0"
              />
            </button>
          </li>
        </ul>

        <div class="h-px bg-slate-100 dark:bg-slate-800" />
        <p class="px-4 py-2.5 text-[11px] text-slate-400">{{ currency.rateLabel }}</p>
      </div>
    </Transition>

    <!-- Mobile bottom sheet -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0"
      >
        <div v-if="open && useSheet" class="fixed inset-0 z-[60]">
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />

          <Transition
            appear
            enter-active-class="transition duration-250 ease-out"
            enter-from-class="translate-y-full"
            leave-active-class="transition duration-200 ease-in"
            leave-to-class="translate-y-full"
          >
            <div
              ref="panel"
              role="listbox"
              aria-label="Select display currency"
              class="absolute inset-x-0 bottom-0 border-t pb-safe
                     border-slate-200 dark:border-slate-700"
              :style="{
                background: 'var(--c-card)',
                borderTopLeftRadius: 'var(--radius-3xl)',
                borderTopRightRadius: 'var(--radius-3xl)'
              }"
            >
              <div class="flex justify-center pt-2.5">
                <span class="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>

              <header class="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p class="font-semibold text-slate-900 dark:text-white">Select currency</p>
                  <p class="text-[11px] text-slate-400">{{ currency.rateLabel }}</p>
                </div>
                <button class="icon-btn" aria-label="Close" @click="close">
                  <Icon name="x" size="w-4 h-4" />
                </button>
              </header>

              <div class="h-px bg-slate-100 dark:bg-slate-800" />

              <ul class="p-3 space-y-1.5">
                <li v-for="(item, index) in currency.list" :key="item.code">
                  <button
                    :ref="(el) => (optionRefs[index] = el)"
                    type="button"
                    role="option"
                    :aria-selected="item.code === currency.code"
                    class="w-full flex items-center gap-3 px-3.5 py-3.5 text-left border transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    :class="
                      item.code === currency.code
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    "
                    :style="{ borderRadius: 'var(--radius-xl)' }"
                    @click="select(item.code)"
                  >
                    <span class="text-2xl leading-none shrink-0" aria-hidden="true">{{ item.flag }}</span>
                    <span class="min-w-0 grow">
                      <span
                        class="block text-sm font-semibold"
                        :class="item.code === currency.code ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'"
                      >
                        {{ item.code }} — {{ item.symbol }}
                      </span>
                      <span class="block text-xs text-slate-400 truncate">{{ item.name }}</span>
                    </span>
                    <Icon
                      v-if="item.code === currency.code"
                      name="check"
                      size="w-5 h-5"
                      class="text-brand-600 shrink-0"
                    />
                  </button>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
