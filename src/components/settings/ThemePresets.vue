<script setup>
import Icon from '@/components/ui/Icon.vue'
import { PRESETS, buildScale, useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

const preview = (preset) => {
  const scale = buildScale(preset.colors.primary)
  return [preset.colors.primary, preset.colors.secondary, preset.colors.accent, scale[200]]
}
</script>

<template>
  <div class="-mx-1 px-1 overflow-x-auto">
    <div class="flex gap-3 min-w-max pb-1">
      <button
        v-for="preset in PRESETS"
        :key="preset.id"
        class="w-[132px] shrink-0 rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5"
        :class="
          theme.selectedPreset === preset.id
            ? 'border-brand-500 shadow-[0_0_0_4px_color-mix(in_srgb,var(--c-primary)_14%,transparent)]'
            : 'border-slate-200 dark:border-slate-700'
        "
        @click="theme.applyPreset(preset.id)"
      >
        <div class="flex gap-1">
          <span
            v-for="(color, i) in preview(preset)"
            :key="i"
            class="h-8 flex-1 rounded-lg"
            :style="{ background: color }"
          />
        </div>
        <p class="mt-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
          {{ preset.name }}
          <Icon
            v-if="theme.selectedPreset === preset.id"
            name="check"
            size="w-3.5 h-3.5"
            class="text-brand-600 ml-auto"
          />
        </p>
      </button>

      <!-- Custom -->
      <div
        class="w-[132px] shrink-0 rounded-2xl border-2 p-3 text-left transition"
        :class="
          theme.selectedPreset === 'custom'
            ? 'border-brand-500 shadow-[0_0_0_4px_color-mix(in_srgb,var(--c-primary)_14%,transparent)]'
            : 'border-dashed border-slate-300 dark:border-slate-700'
        "
      >
        <div class="h-8 rounded-lg flex items-center justify-center bg-surface-subtle">
          <Icon name="palette" size="w-5 h-5" class="text-brand-600" />
        </div>
        <p class="mt-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
          Custom
          <Icon
            v-if="theme.selectedPreset === 'custom'"
            name="check"
            size="w-3.5 h-3.5"
            class="text-brand-600 ml-auto"
          />
        </p>
      </div>
    </div>
  </div>
</template>
