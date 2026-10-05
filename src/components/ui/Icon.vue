<script setup>
import { computed } from 'vue'
import { icons } from '@/utils/icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'w-5 h-5' },
  strokeWidth: { type: [Number, String], default: 1.8 }
})

const path = computed(() => icons[props.name] || '')
</script>

<template>
  <svg
    :class="size"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="path" />
  </svg>
</template>
