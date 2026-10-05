<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Spinner from './Spinner.vue'
import { useLoadingStore } from '@/stores/loading'

/**
 * The one loader for the whole app.
 *
 * Three sources, all real:
 *   1. `loading.action` — user actions wrapped in `runAction()` (delete, save…).
 *   2. `loading.isBusy` — any async work tracked by a store via `track()`.
 *   3. A click on any control that isn't marked `data-no-loader` — so a plain
 *      button/link always acknowledges the tap, using its own label.
 *
 * Rules that keep it from feeling sluggish:
 *   - fast route changes and fast taps never flash (ROUTE_DELAY / CLICK_MIN)
 *   - once shown it stays at least MIN_VISIBLE, so it reads as deliberate
 *   - if real work is still running, only that work decides when to hide
 */
const loading = useLoadingStore()
const router = useRouter()
const { t } = useI18n()

const ROUTE_DELAY = 180
const MIN_VISIBLE = 320
const CLICK_MIN = 260
const MAX_LABEL = 30

/** Controls that must stay instant: tiles, chips, tabs, dropdowns, pagination. */
const CLICKABLE = 'button, a[href], [role="button"], [role="tab"], summary'
const SKIP = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'LABEL', 'OPTION', 'AUDIO', 'VIDEO'])

const visible = ref(false)
const label = ref('')

let routeTimer = null
let hideTimer = null
let shownAt = 0

const busy = () => loading.action || loading.isBusy

const show = (text = '') => {
  clearTimeout(hideTimer)
  if (text) label.value = text
  if (visible.value) return
  shownAt = performance.now()
  visible.value = true
}

const hide = () => {
  clearTimeout(routeTimer)
  if (!visible.value) return
  if (busy()) return // real work owns the spinner now
  const left = MIN_VISIBLE - (performance.now() - shownAt)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (busy()) return
    visible.value = false
    label.value = ''
  }, Math.max(0, left))
}

/* ── 1 & 2: real work ─────────────────────────────────────────────── */
watch(
  () => loading.action,
  (value) => {
    if (value) {
      label.value = loading.actionMessage
      show()
    } else hide()
  }
)

watch(
  () => loading.isBusy,
  (value) => (value ? show() : hide())
)

/* ── 3: every click gets an acknowledgement ────────────────────────── */
/**
 * The label is what makes this feel real instead of generic: it reads the
 * control that was tapped, in order of specificity.
 *
 *   data-loading-key   i18n key  -> t('pos.processingPayment')
 *   data-loading-label literal   -> "Exporting report"
 *   own text           visible label text of a text button
 *   title/aria-label   icon-only buttons (row actions, filter toggles…)
 */
const labelFrom = (el) => {
  const key = el.dataset.loadingKey
  if (key) {
    const translated = t(key)
    if (translated && !String(translated).includes(key)) return String(translated).slice(0, MAX_LABEL)
  }
  const explicit = el.dataset.loadingLabel
  if (explicit) return explicit.slice(0, MAX_LABEL)
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
  if (text && text.length <= MAX_LABEL) return text
  return (el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, MAX_LABEL)
}

const onClick = (event) => {
  if (event.defaultPrevented || busy()) return
  const el = event.target.closest?.(CLICKABLE)
  if (!el || SKIP.has(el.tagName)) return
  if (el.closest('[data-no-loader]') || el.disabled || el.getAttribute('aria-disabled') === 'true')
    return

  show(labelFrom(el))
  hideTimer = setTimeout(() => {
    if (!busy()) hide()
  }, CLICK_MIN)
}

/* ── slow route changes ────────────────────────────────────────────── */
router.beforeEach((to, from, next) => {
  if (to.path === from.path) return next()
  clearTimeout(routeTimer)
  routeTimer = setTimeout(() => show(), ROUTE_DELAY)
  next()
})

router.afterEach(hide)
router.onError(hide)

onMounted(() => document.addEventListener('click', onClick, true))
onBeforeUnmount(() => {
  document.removeEventListener('click', onClick, true)
  clearTimeout(routeTimer)
  clearTimeout(hideTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[95] grid place-items-center px-4"
        :style="{ background: 'color-mix(in srgb, var(--c-bg) 58%, transparent)' }"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <!-- hairline sweep keeps motion alive even when the work is instant -->
        <div class="absolute inset-x-0 top-0 h-[3px] overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            class="h-full w-1/3 rounded-r-full"
            :style="{
              background: 'var(--c-primary)',
              animation: 'loader-sweep 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }"
          />
        </div>

        <div
          class="relative flex items-center gap-3.5 px-5 py-4 rounded-2xl border max-w-[calc(100vw-2rem)]"
          :style="{
            background: 'var(--c-card)',
            borderColor: 'var(--c-border)',
            boxShadow: 'var(--shadow-lift)'
          }"
        >
          <span
            class="w-10 h-10 shrink-0 grid place-items-center rounded-xl text-white"
            :style="{ background: 'var(--c-primary)' }"
          >
            <Spinner :size="20" :stroke="2.5" />
          </span>
          <div class="min-w-0">
            <p class="text-[13.5px] font-semibold text-slate-900 dark:text-white truncate">
              {{ label || t('common.pleaseWait') }}
            </p>
            <p class="text-[11.5px] text-slate-400 mt-0.5">{{ t('common.loadingOneMoment') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
