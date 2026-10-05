<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import { buildPageList, PER_PAGE_OPTIONS } from '@/composables/usePagination'

const props = defineProps({
  page: { type: Number, required: true },
  perPage: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  lastPage: { type: Number, default: 1 },
  from: { type: Number, default: 0 },
  to: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  showPerPage: { type: Boolean, default: true },
  showEdges: { type: Boolean, default: true },
  label: { type: String, default: 'results' }
})

const emit = defineEmits(['update:page', 'update:perPage'])

const desktopPages = computed(() => buildPageList(props.page, props.lastPage, 7))
const mobilePages = computed(() => buildPageList(props.page, props.lastPage, 5))

const isFirst = computed(() => props.page <= 1)
const isLast = computed(() => props.page >= props.lastPage)
/** First / Last shortcuts only earn their space on longer datasets. */
const useEdges = computed(() => props.showEdges && props.lastPage > 5)

const go = (target) => {
  if (typeof target !== 'number' || target === props.page) return
  emit('update:page', Math.min(Math.max(1, target), props.lastPage))
}
</script>

<template>
  <nav
    class="flex flex-col gap-3 px-4 py-2.5 border-t sm:flex-row sm:items-center sm:justify-between"
    :style="{ borderColor: 'var(--c-border)' }"
    role="navigation"
    aria-label="Pagination"
  >
    <!-- Summary + rows per page -->
    <div class="flex items-center justify-between gap-3 sm:justify-start min-w-0">
      <p class="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
        <template v-if="loading">Loading…</template>
        <template v-else-if="!total">No {{ label }}</template>
        <template v-else>
          Showing <span class="font-semibold text-slate-700 dark:text-slate-200">{{ from }}–{{ to }}</span>
          of <span class="font-semibold text-slate-700 dark:text-slate-200">{{ total.toLocaleString() }}</span>
          {{ label }}
        </template>
      </p>

      <label v-if="showPerPage" class="flex items-center gap-2 shrink-0">
        <span class="hidden sm:inline text-xs text-slate-400">Rows</span>
        <select
          :value="perPage"
          class="field h-8 py-0 pl-2.5 pr-7 text-xs w-[58px] cursor-pointer"
          aria-label="Rows per page"
          @change="emit('update:perPage', Number($event.target.value))"
        >
          <option v-for="option in PER_PAGE_OPTIONS" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <!-- Controls -->
    <div v-if="lastPage > 1" class="flex items-center justify-between gap-1.5 sm:justify-end shrink-0">
      <!-- First -->
      <button data-no-loader
        v-if="useEdges"
        type="button"
        class="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200
               dark:border-slate-700 text-slate-500 transition
               hover:border-brand-400 hover:text-brand-600 disabled:opacity-35 disabled:cursor-not-allowed
               disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 disabled:hover:text-slate-500
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :disabled="isFirst || loading"
        aria-label="First page"
        @click="go(1)"
      >
        <Icon name="chevronRight" size="w-4 h-4" class="rotate-180 -mr-2" />
        <Icon name="chevronRight" size="w-4 h-4" class="rotate-180" />
      </button>

      <!-- Previous -->
      <button data-no-loader
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700
               text-sm font-medium text-slate-600 dark:text-slate-300 transition
               hover:border-brand-400 hover:text-brand-600 active:scale-[.97]
               disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-slate-200
               dark:disabled:hover:border-slate-700 disabled:hover:text-slate-600 disabled:active:scale-100
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :disabled="isFirst || loading"
        aria-label="Previous page"
        @click="go(page - 1)"
      >
        <Icon name="chevronRight" size="w-4 h-4" class="rotate-180" />
        <span class="hidden sm:inline">Previous</span>
      </button>

      <!-- Desktop page numbers -->
      <div class="hidden sm:flex items-center gap-1">
        <template v-for="(item, index) in desktopPages" :key="`d-${index}`">
          <span v-if="item === '…'" class="w-7 text-center text-sm text-slate-400 select-none">…</span>
          <button data-no-loader
            v-else
            type="button"
            class="min-w-9 h-9 px-2 rounded-xl text-sm font-semibold tabular-nums transition active:scale-[.97]
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            :class="
              item === page
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600'
            "
            :aria-current="item === page ? 'page' : undefined"
            :aria-label="`Page ${item}`"
            :disabled="loading"
            @click="go(item)"
          >
            {{ item }}
          </button>
        </template>
      </div>

      <!-- Mobile: compact page pills -->
      <div class="flex sm:hidden items-center gap-1">
        <template v-for="(item, index) in mobilePages" :key="`m-${index}`">
          <span v-if="item === '…'" class="w-5 text-center text-sm text-slate-400 select-none">…</span>
          <button data-no-loader
            v-else
            type="button"
            class="min-w-8 h-8 px-1.5 rounded-lg text-xs font-semibold tabular-nums transition"
            :class="
              item === page
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            "
            :aria-current="item === page ? 'page' : undefined"
            :disabled="loading"
            @click="go(item)"
          >
            {{ item }}
          </button>
        </template>
      </div>

      <!-- Next -->
      <button data-no-loader
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700
               text-sm font-medium text-slate-600 dark:text-slate-300 transition
               hover:border-brand-400 hover:text-brand-600 active:scale-[.97]
               disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-slate-200
               dark:disabled:hover:border-slate-700 disabled:hover:text-slate-600 disabled:active:scale-100
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :disabled="isLast || loading"
        aria-label="Next page"
        @click="go(page + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <Icon name="chevronRight" size="w-4 h-4" />
      </button>

      <!-- Last -->
      <button data-no-loader
        v-if="useEdges"
        type="button"
        class="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200
               dark:border-slate-700 text-slate-500 transition
               hover:border-brand-400 hover:text-brand-600 disabled:opacity-35 disabled:cursor-not-allowed
               disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 disabled:hover:text-slate-500
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :disabled="isLast || loading"
        aria-label="Last page"
        @click="go(lastPage)"
      >
        <Icon name="chevronRight" size="w-4 h-4" class="-mr-2" />
        <Icon name="chevronRight" size="w-4 h-4" />
      </button>
    </div>
  </nav>
</template>
