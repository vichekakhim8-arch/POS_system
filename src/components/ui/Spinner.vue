<script setup>
import { computed } from 'vue'

/**
 * Brand spinner — a single SVG ring, no dependencies.
 * Inherits `currentColor` so it adapts to any context automatically.
 */
const props = defineProps({
  size: { type: [String, Number], default: 24 },
  stroke: { type: Number, default: 2.5 },
  label: { type: String, default: 'Loading' }
})

const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <span
    class="inline-block shrink-0"
    :style="{ width: px, height: px }"
    role="status"
    :aria-label="label"
  >
    <svg class="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-opacity="0.18" :stroke-width="stroke" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        :stroke-width="stroke"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>
