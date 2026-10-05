<script setup>
import { useThemeStore } from '@/stores/theme'
import Icon from './Icon.vue'

defineProps({
  compact: { type: Boolean, default: false }
})

const theme = useThemeStore()

const modes = [
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
  { value: 'system', icon: 'monitor', label: 'System' }
]
</script>

<template>
  <!-- Compact: single icon button used in the navbar -->
  <button
    v-if="compact"
    class="icon-btn"
    :title="`Theme: ${theme.mode}`"
    @click="theme.toggleMode()"
  >
    <Transition name="fade" mode="out-in">
      <Icon :key="theme.isDark ? 'sun' : 'moon'" :name="theme.isDark ? 'sun' : 'moon'" />
    </Transition>
  </button>

  <!-- Full segmented control -->
  <div v-else class="segmented w-full sm:w-auto">
    <button
      v-for="m in modes"
      :key="m.value"
      class="segmented-item flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
      :class="theme.mode === m.value ? 'segmented-item-active' : ''"
      @click="theme.setMode(m.value)"
    >
      <Icon :name="m.icon" size="w-4 h-4" />
      <span>{{ m.label }}</span>
    </button>
  </div>
</template>
