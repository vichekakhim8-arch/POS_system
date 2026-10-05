<script setup>
import Spinner from './Spinner.vue'
import Icon from './Icon.vue'

/**
 * Centered loading block — the single loading surface for the whole app.
 *
 * variant="block"   fills its parent and centers (inside cards / tables)
 * variant="inline"  compact row, for toolbars and small panels
 * variant="overlay" covers the nearest positioned parent, content stays visible
 * variant="screen"  fixed full-screen, used for app boot / blocking work
 *
 * Every variant centers on BOTH axes via grid place-items-center.
 */
defineProps({
  variant: { type: String, default: 'block' },
  title: { type: String, default: 'Loading' },
  description: { type: String, default: '' },
  size: { type: Number, default: 28 },
  minHeight: { type: String, default: '240px' },
  brandMark: { type: Boolean, default: false }
})
</script>

<template>
  <!-- inline: single centered row -->
  <div
    v-if="variant === 'inline'"
    class="w-full grid place-items-center py-4"
    role="status"
    aria-live="polite"
  >
    <span class="inline-flex items-center gap-2.5 text-slate-500">
      <Spinner :size="18" :stroke="3" class="text-brand-600" />
      <span class="text-[13px] font-medium">{{ title }}</span>
    </span>
  </div>

  <!-- block / overlay / screen -->
  <div
    v-else
    class="grid place-items-center text-center"
    :class="{
      'w-full': variant === 'block',
      'absolute inset-0 z-30 backdrop-blur-[2px] rounded-[inherit]': variant === 'overlay',
      'fixed inset-0 z-[90]': variant === 'screen'
    }"
    :style="{
      minHeight: variant === 'block' ? minHeight : undefined,
      background:
        variant === 'overlay'
          ? 'color-mix(in srgb, var(--c-card) 70%, transparent)'
          : variant === 'screen'
            ? 'var(--c-bg)'
            : undefined
    }"
    role="status"
    aria-live="polite"
  >
    <div class="flex flex-col items-center justify-center gap-3.5 px-6 max-w-[300px]">
      <!-- brand mark for app / route level waits -->
      <span
        v-if="brandMark"
        class="relative w-12 h-12 grid place-items-center rounded-2xl text-white shrink-0"
        :style="{ background: 'var(--c-primary)' }"
      >
        <span
          class="absolute inset-0 rounded-2xl animate-ping opacity-20"
          :style="{ background: 'var(--c-primary)' }"
        />
        <slot name="mark"><Icon name="store" size="w-6 h-6" class="relative" /></slot>
      </span>

      <Spinner v-else :size="size" class="text-brand-600" />

      <div>
        <p class="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">{{ title }}</p>
        <p v-if="description" class="text-xs text-slate-400 mt-1 leading-relaxed">
          {{ description }}
        </p>
      </div>

      <slot />
    </div>
  </div>
</template>
