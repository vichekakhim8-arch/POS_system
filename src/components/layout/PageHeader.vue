<script setup>
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'

/**
 * One page header for every route. Keeps title/description/actions on a
 * single consistent baseline so no page invents its own heading treatment.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  backTo: { type: String, default: '' },
  icon: { type: String, default: '' }
})

const router = useRouter()
</script>

<template>
  <header
    class="flex flex-col gap-3 pb-4 mb-5 border-b sm:flex-row sm:items-center sm:justify-between"
    :style="{ borderColor: 'var(--c-border)' }"
  >
    <div class="flex items-start gap-3 min-w-0">
      <button
        v-if="backTo"
        type="button"
        class="mt-0.5 w-9 h-9 grid place-items-center rounded-xl shrink-0 text-slate-500
               transition hover:text-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :style="{ background: 'var(--c-subtle)' }"
        aria-label="Go back"
        @click="router.push(backTo)"
      >
        <Icon name="chevronRight" size="w-4 h-4" class="rotate-180" />
      </button>

      <span
        v-else-if="icon"
        class="w-9 h-9 rounded-xl grid place-items-center shrink-0"
        :style="{
          background: 'color-mix(in srgb, var(--c-primary) 11%, transparent)',
          color: 'var(--c-primary)'
        }"
        aria-hidden="true"
      >
        <Icon :name="icon" size="w-[18px] h-[18px]" />
      </span>

      <div class="min-w-0">
        <h1 class="t-display text-slate-900 dark:text-white truncate">{{ title }}</h1>
        <p v-if="subtitle" class="t-caption text-slate-400 mt-0.5 truncate">{{ subtitle }}</p>
      </div>
    </div>

    <!-- actions scroll horizontally on mobile rather than wrapping into a tall stack -->
    <div
      v-if="$slots.actions"
      class="flex items-center gap-2 shrink-0 overflow-x-auto sm:overflow-visible
             -mx-1 px-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
