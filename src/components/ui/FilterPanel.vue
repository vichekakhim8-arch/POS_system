<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** number of filters currently away from their default */
  activeCount: { type: Number, default: 0 },
  /** [{ key, group, label }] — rendered as removable chips */
  chips: { type: Array, default: () => [] },
  label: { type: String, default: 'Filter' }
})

const emit = defineEmits(['update:open', 'reset', 'remove-chip'])

const toggle = () => emit('update:open', !props.open)
const hasActive = computed(() => props.activeCount > 0)
</script>

<template>
  <div class="w-full">
    <!-- ONE ROW: search grows, filter + reset stay compact -->
    <div class="flex items-center gap-2 min-w-0">
      <div class="grow min-w-0"><slot name="search" /></div>

      <!-- inline quick filters (wide screens only) -->
      <div v-if="$slots.inline" class="hidden xl:flex items-center gap-2 shrink-0">
        <slot name="inline" />
      </div>

      <div class="flex gap-2 shrink-0">
        <button data-no-loader
          type="button"
          class="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 text-sm font-semibold border transition
                 shrink-0 active:scale-[.985] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          :class="
            open || hasActive
              ? 'border-brand-500 text-brand-600 bg-brand-50/60 dark:bg-brand-500/10'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600'
          "
          :style="{ borderRadius: 'var(--radius-xl)' }"
          :aria-expanded="open"
          @click="toggle"
        >
          <Icon name="filter" size="w-4 h-4 shrink-0" />
          <span class="hidden md:inline">{{ label }}</span>
          <span
            v-if="hasActive"
            class="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold
                   inline-flex items-center justify-center tabular-nums"
          >
            {{ activeCount }}
          </span>
          <Icon
            name="chevronRight"
            size="w-3.5 h-3.5"
            class="opacity-60 transition-transform duration-300"
            :class="open ? '-rotate-90' : 'rotate-90'"
          />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-90"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0 scale-90"
        >
          <button
            v-if="hasActive"
            data-no-loader
            type="button"
            class="inline-flex items-center gap-1.5 h-11 w-11 md:w-auto md:px-3 justify-center
                   text-sm font-semibold text-slate-500 shrink-0
                   border border-slate-200 dark:border-slate-700 transition
                   hover:text-rose-600 hover:border-rose-300
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20"
            :style="{ borderRadius: 'var(--radius-xl)' }"
            aria-label="Reset filters"
            @click="emit('reset')"
          >
            <Icon name="refresh" size="w-4 h-4 shrink-0" />
            <span class="hidden md:inline">Reset</span>
          </button>
        </Transition>
      </div>
    </div>

    <!-- smooth height + fade reveal -->
    <div
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
      :style="{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }"
    >
      <div class="overflow-hidden">
        <div
          class="mt-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800
                 bg-white dark:bg-slate-900 shadow-[0_8px_24px_-16px_rgb(16_24_40/0.3)]
                 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <slot />
        </div>
      </div>
    </div>

    <!-- active filter chips -->
    <TransitionGroup
      v-if="chips.length"
      name="list"
      tag="div"
      class="flex flex-wrap items-center gap-1.5 mt-2.5"
    >
      <span key="chips-label" class="text-[11px] font-semibold text-slate-400 mr-0.5">Active:</span>
      <button data-no-loader
        v-for="chip in chips"
        :key="chip.key"
        type="button"
        class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 h-7 rounded-lg text-[11.5px] font-semibold
               transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        :style="{
          background: 'color-mix(in srgb, var(--c-primary) 10%, transparent)',
          color: 'var(--c-primary)'
        }"
        :aria-label="`Remove filter ${chip.label}`"
        @click="emit('remove-chip', chip)"
      >
        <span class="opacity-70">{{ chip.group }}:</span>
        {{ chip.label }}
        <Icon name="x" size="w-3 h-3" class="opacity-70" />
      </button>
      <button data-no-loader
        key="clear-all"
        type="button"
        class="text-[11.5px] font-semibold text-slate-400 hover:text-rose-600 transition ml-0.5 px-1.5 h-7"
        @click="emit('reset')"
      >
        Clear all
      </button>
    </TransitionGroup>
  </div>
</template>
