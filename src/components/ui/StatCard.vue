<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import AnimatedNumber from './AnimatedNumber.vue'

/**
 * KPI tile. Deliberately plain: label → value → context.
 * No decorative fills, no gradient edges — the number is the hero.
 */
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  amount: { type: Number, default: null },
  decimals: { type: Number, default: 0 },
  prefix: { type: String, default: '' },
  icon: { type: String, default: 'chart' },
  tone: { type: String, default: 'brand' },
  trend: { type: String, default: '' },
  hint: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const TONES = {
  brand: 'var(--c-primary)',
  emerald: 'var(--c-success)',
  amber: 'var(--c-warning)',
  rose: 'var(--c-danger)',
  sky: 'var(--c-secondary)',
  violet: 'var(--c-accent)'
}

const color = computed(() => TONES[props.tone] || TONES.brand)
const negative = computed(() => props.trend.startsWith('-'))
const trendColor = computed(() => (negative.value ? 'var(--c-danger)' : 'var(--c-success)'))
</script>

<template>
  <div class="metric p-5 flex flex-col gap-3 min-h-[116px]">
    <div class="flex items-start justify-between gap-3">
      <p class="t-micro text-slate-400 truncate pt-0.5">{{ label }}</p>
      <span
        class="w-8 h-8 rounded-lg grid place-items-center shrink-0 -mt-0.5 -mr-0.5"
        :style="{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }"
        aria-hidden="true"
      >
        <Icon :name="icon" size="w-4 h-4" />
      </span>
    </div>

    <div v-if="loading" class="h-7 w-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
    <p
      v-else
      class="text-[26px] leading-none font-bold text-slate-900 dark:text-white truncate tabular-nums"
    >
      <AnimatedNumber
        v-if="amount !== null"
        :value="amount"
        :decimals="decimals"
        :prefix="prefix"
        :currency="!!prefix"
      />
      <span v-else>{{ value }}</span>
    </p>

    <div v-if="trend || hint" class="flex items-center gap-2 mt-auto">
      <span
        v-if="trend"
        class="inline-flex items-center gap-1 text-[11.5px] font-bold leading-none"
        :style="{ color: trendColor }"
      >
        <Icon :name="negative ? 'arrowDown' : 'trendUp'" size="w-3 h-3" />{{ trend }}
      </span>
      <span v-if="hint" class="t-caption text-slate-400 truncate">{{ hint }}</span>
    </div>
  </div>
</template>
