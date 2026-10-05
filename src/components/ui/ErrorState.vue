<script setup>
import Icon from './Icon.vue'
import Button from './Button.vue'

/** Centered error block with a retry action. Mirrors LoadingState's layout. */
defineProps({
  title: { type: String, default: 'Something went wrong' },
  description: { type: String, default: 'Please try again in a moment.' },
  retryLabel: { type: String, default: 'Try again' },
  minHeight: { type: String, default: '240px' }
})

defineEmits(['retry'])
</script>

<template>
  <div
    class="w-full grid place-items-center text-center"
    :style="{ minHeight }"
    role="alert"
  >
    <div class="flex flex-col items-center gap-3.5 px-6 max-w-[320px]">
      <span
        class="w-12 h-12 grid place-items-center rounded-2xl shrink-0"
        :style="{
          background: 'color-mix(in srgb, var(--c-danger) 12%, transparent)',
          color: 'var(--c-danger)'
        }"
      >
        <Icon name="alert" size="w-6 h-6" />
      </span>

      <div>
        <p class="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{{ title }}</p>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ description }}</p>
      </div>

      <Button size="sm" variant="secondary" icon="refresh" @click="$emit('retry')">
        {{ retryLabel }}
      </Button>
    </div>
  </div>
</template>
