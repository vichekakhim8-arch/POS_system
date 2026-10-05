<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import Spinner from './Spinner.vue'

/**
 * The single button primitive.
 *
 * Heights are FIXED (not padding-derived) so a button always lines up with an
 * Input of the same size — this was the main source of ragged toolbars.
 * Colours come from theme tokens, never hard-coded palette classes.
 */
const props = defineProps({
  // primary | secondary | outline | ghost | danger | success
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' }, // sm | md | lg
  icon: { type: String, default: '' },
  iconRight: { type: String, default: '' },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button' }
})

/** Matches Input: sm 36px · md 44px · lg 48px */
const sizes = {
  sm: { box: 'h-9 px-3 text-[13px] gap-1.5', icon: 'w-3.5 h-3.5', spinner: 14 },
  md: { box: 'h-11 px-4 text-sm gap-2', icon: 'w-4 h-4', spinner: 16 },
  lg: { box: 'h-12 px-5 text-[15px] gap-2', icon: 'w-[18px] h-[18px]', spinner: 18 }
}

const base =
  'relative inline-flex items-center justify-center font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.985] ' +
  'focus:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-45'

const size = computed(() => sizes[props.size] || sizes.md)

const classes = computed(() => [
  base,
  size.value.box,
  props.block ? 'w-full' : '',
  props.variant === 'secondary' || props.variant === 'outline'
    ? 'text-slate-700 dark:text-slate-200 hover:text-brand-600'
    : '',
  props.variant === 'ghost' ? 'text-slate-600 dark:text-slate-300 hover:text-brand-600' : '',
  ['primary', 'danger', 'success'].includes(props.variant) ? 'text-white hover:brightness-[0.94]' : ''
])

/** Token-driven so any brand/theme change propagates automatically. */
const styles = computed(() => {
  const radius = 'var(--btn-radius, var(--radius-xl))'
  const ring = {
    primary: 'color-mix(in srgb, var(--c-primary) 26%, transparent)',
    danger: 'color-mix(in srgb, var(--c-danger) 26%, transparent)',
    success: 'color-mix(in srgb, var(--c-success) 26%, transparent)'
  }

  const map = {
    primary: {
      background: 'var(--c-btn-bg, var(--c-primary))',
      color: 'var(--c-btn-text, #fff)',
      boxShadow: '0 1px 2px color-mix(in srgb, var(--c-primary) 28%, transparent)',
      '--tw-ring-color': ring.primary
    },
    secondary: {
      background: 'var(--c-subtle)',
      '--tw-ring-color': ring.primary
    },
    outline: {
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1px var(--c-border)',
      '--tw-ring-color': ring.primary
    },
    ghost: {
      background: 'transparent',
      '--tw-ring-color': ring.primary
    },
    danger: {
      background: 'var(--c-danger)',
      boxShadow: '0 1px 2px color-mix(in srgb, var(--c-danger) 28%, transparent)',
      '--tw-ring-color': ring.danger
    },
    success: {
      background: 'var(--c-success)',
      boxShadow: '0 1px 2px color-mix(in srgb, var(--c-success) 28%, transparent)',
      '--tw-ring-color': ring.success
    }
  }

  return { borderRadius: radius, ...(map[props.variant] || map.primary) }
})
</script>

<template>
  <button :type="type" :class="classes" :style="styles" :disabled="disabled || loading">
    <!-- hover wash for quiet variants, token-based instead of slate-* classes -->
    <span
      v-if="['secondary', 'outline', 'ghost'].includes(variant)"
      class="absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none"
      :style="{ background: 'color-mix(in srgb, var(--c-primary) 8%, transparent)' }"
      aria-hidden="true"
    />
    <Spinner v-if="loading" :size="size.spinner" :stroke="3" class="relative" />
    <Icon v-else-if="icon" :name="icon" :size="size.icon" class="relative shrink-0" />
    <span class="relative"><slot /></span>
    <Icon v-if="iconRight && !loading" :name="iconRight" :size="size.icon" class="relative shrink-0" />
  </button>
</template>
