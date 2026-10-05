<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCurrencyStore } from '@/stores/currency'

const props = defineProps({
  value: { type: Number, default: 0 },
  decimals: { type: Number, default: 0 },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
  /** When true the value is treated as a BASE-currency amount and is
   *  converted + formatted with the global display currency. */
  currency: { type: Boolean, default: false },
  duration: { type: Number, default: 900 }
})

const currencyStore = useCurrencyStore()

const display = ref(0)
let frame = null

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

const animate = (to) => {
  cancelAnimationFrame(frame)
  const from = display.value
  const start = performance.now()
  const step = (now) => {
    const progress = Math.min((now - start) / props.duration, 1)
    display.value = from + (to - from) * easeOut(progress)
    if (progress < 1) frame = requestAnimationFrame(step)
    else display.value = to
  }
  frame = requestAnimationFrame(step)
}

watch(() => props.value, (v) => animate(Number(v) || 0), { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(frame))

/** Re-formats instantly when the display currency changes. */
const text = computed(() => {
  if (props.currency) return currencyStore.format(display.value)
  const body = display.value.toLocaleString('en-US', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  })
  return `${props.prefix}${body}${props.suffix}`
})
</script>

<template>
  <span class="tabular-nums">{{ text }}</span>
</template>
