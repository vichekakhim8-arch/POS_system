<script setup>
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'

defineProps({
  modelValue: { type: String, default: 'All' },
  categories: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue'])

const scroller = ref(null)
const scrollBy = (amount) => scroller.value?.scrollBy({ left: amount, behavior: 'smooth' })
</script>

<template>
  <div class="relative group/tabs">
    <!-- desktop scroll arrows -->
    <button data-no-loader
      type="button"
      class="hidden lg:flex absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center
             rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm
             text-slate-500 opacity-0 group-hover/tabs:opacity-100 transition hover:text-brand-600"
      aria-label="Scroll categories left"
      @click="scrollBy(-240)"
    >
      <Icon name="chevronRight" size="w-3.5 h-3.5" class="rotate-180" />
    </button>

    <div
      ref="scroller"
      class="flex gap-2 overflow-x-auto pb-1 -mb-1 px-0.5 snap-x scroll-smooth
             [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button data-no-loader
        v-for="category in categories"
        :key="category"
        type="button"
        class="shrink-0 snap-start inline-flex items-center gap-2 px-4 h-10 text-[13px] font-semibold
               whitespace-nowrap border transition-all duration-200 active:scale-[.97]
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
        :class="
          modelValue === category
            ? 'text-white border-transparent shadow-sm'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:text-brand-600'
        "
        :style="{
          borderRadius: 'var(--radius-xl)',
          background: modelValue === category ? 'var(--pos-active-category)' : undefined,
          boxShadow:
            modelValue === category
              ? '0 6px 16px -6px color-mix(in srgb, var(--pos-active-category) 65%, transparent)'
              : undefined
        }"
        @click="$emit('update:modelValue', category)"
      >
        <span
          v-if="modelValue === category"
          class="w-1.5 h-1.5 rounded-full bg-white/80"
          aria-hidden="true"
        />
        {{ category }}
      </button>
    </div>

    <button data-no-loader
      type="button"
      class="hidden lg:flex absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center
             rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm
             text-slate-500 opacity-0 group-hover/tabs:opacity-100 transition hover:text-brand-600"
      aria-label="Scroll categories right"
      @click="scrollBy(240)"
    >
      <Icon name="chevronRight" size="w-3.5 h-3.5" />
    </button>
  </div>
</template>
