<script setup>
import Icon from './Icon.vue'

defineProps({
  icon: { type: String, default: '' },
  active: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
  hint: { type: String, default: '' }
})
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition"
    :class="[
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
        : active
          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    ]"
  >
    <Icon v-if="icon" :name="icon" size="w-4 h-4" class="shrink-0 opacity-80" />
    <span class="grow truncate"><slot /></span>
    <span v-if="hint" class="text-[11px] text-slate-400">{{ hint }}</span>
    <Icon v-if="active" name="check" size="w-4 h-4" class="text-brand-600 shrink-0" />
  </button>
</template>
