<script setup>
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'

/**
 * Product thumbnail with a graceful fallback.
 *
 * If the remote image 404s / is blocked / the device is offline, we swap to a
 * branded monogram tile instead of the browser's broken-image icon.
 */
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'w-10 h-10' },
  radius: { type: String, default: 'rounded-lg' },
  /** small | md — controls monogram typography */
  scale: { type: String, default: 'md' }
})

const failed = ref(false)
const loaded = ref(false)

// A new src deserves a fresh attempt.
watch(
  () => props.src,
  () => {
    failed.value = false
    loaded.value = false
  }
)

const monogram = computed(() =>
  (props.alt || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

/** Deterministic hue so the same product always gets the same tile. */
const hue = computed(() => {
  let h = 0
  for (const ch of props.alt || '?') h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
})
</script>

<template>
  <span
    class="relative inline-block shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800"
    :class="[size, radius]"
  >
    <!-- skeleton while the bitmap decodes -->
    <span
      v-if="!loaded && !failed"
      class="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700"
      aria-hidden="true"
    />

    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    />

    <!-- fallback: branded monogram, never a torn-image icon -->
    <span
      v-else
      class="absolute inset-0 grid place-items-center font-bold select-none"
      :class="scale === 'sm' ? 'text-[10px]' : 'text-xs'"
      :style="{
        background: `hsl(${hue} 62% 94%)`,
        color: `hsl(${hue} 52% 38%)`
      }"
      :title="alt"
    >
      <span v-if="monogram !== '?'">{{ monogram }}</span>
      <Icon v-else name="box" size="w-4 h-4" />
    </span>
  </span>
</template>
