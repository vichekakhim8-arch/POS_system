<script setup>
import { computed } from 'vue'

/**
 * Status badge. Colour comes from semantic theme tokens, so a brand/theme
 * change propagates automatically and dark mode needs no special casing.
 * Always pairs colour with a label (and optional dot) — never colour alone.
 */
const props = defineProps({
  type: { type: String, default: 'neutral' },
  size: { type: String, default: 'md' }, // sm | md
  dot: { type: Boolean, default: false }
})

/** Every status in the app maps to exactly one of five semantic tones. */
const TONES = {
  // success
  Paid: 'success', Active: 'success', Received: 'success', In: 'success',
  Completed: 'success', Approved: 'success', success: 'success',
  // warning
  Pending: 'warning', Low: 'warning', Scheduled: 'warning',
  Requested: 'warning', Expired: 'warning', warning: 'warning',
  // danger
  Refunded: 'danger', Out: 'danger', Rejected: 'danger',
  Cancelled: 'danger', danger: 'danger',
  // info / brand
  Admin: 'brand', Owner: 'brand',
  Manager: 'info', Cashier: 'info', info: 'info',
  // neutral
  Draft: 'neutral', Disabled: 'neutral', Inactive: 'neutral', Kitchen: 'neutral'
}

const VAR = {
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  info: 'var(--c-info, var(--c-secondary))',
  brand: 'var(--c-primary)',
  neutral: 'var(--c-muted)'
}

const color = computed(() => VAR[TONES[props.type] || 'neutral'])

const classes = computed(() => [
  'inline-flex items-center gap-1.5 font-semibold whitespace-nowrap rounded-lg',
  props.size === 'sm' ? 'px-2 h-[20px] text-[10.5px]' : 'px-2.5 h-[24px] text-[11.5px]'
])

const styles = computed(() => ({
  background: `color-mix(in srgb, ${color.value} 13%, transparent)`,
  color: color.value
}))
</script>

<template>
  <span :class="classes" :style="styles">
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full shrink-0"
      :style="{ background: color }"
      aria-hidden="true"
    />
    <slot>{{ type }}</slot>
  </span>
</template>
