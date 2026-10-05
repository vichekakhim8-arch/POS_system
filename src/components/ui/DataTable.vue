<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import Pagination from './Pagination.vue'
import ErrorState from './ErrorState.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { usePagination } from '@/composables/usePagination'

const props = defineProps({
  // [{ key, label, align, width, sortable, cardHide, sticky }]
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  emptyText: { type: String, default: '' },
  emptyIcon: { type: String, default: 'search' },
  minWidth: { type: String, default: 'min-w-[720px]' },
  /** Body height class — pass a fixed class (h-[…] / max-h-[…]) to scroll. */
  maxHeight: { type: String, default: '' },
  /** Extra classes for the outer card, e.g. "h-full" inside a stretched grid cell. */
  panelClass: { type: String, default: '' },
  clickable: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  allowCardView: { type: Boolean, default: true },
  allowFullscreen: { type: Boolean, default: true },
  defaultView: { type: String, default: 'table' },
  cardColumns: { type: String, default: 'sm:grid-cols-2 xl:grid-cols-3' },
  loading: { type: Boolean, default: false },
  /** Error message — replaces the body with a centered retry state. */
  error: { type: String, default: '' },
  /* deletion */
  /** Show DataTable's own confirmation before emitting `delete-selected`. */
  confirmDelete: { type: Boolean, default: false },
  deleteTitle: { type: String, default: '' },
  deleteMessage: { type: String, default: '' },
  deleteLabel: { type: String, default: '' },
  /* pagination */
  paginate: { type: Boolean, default: true },
  perPage: { type: Number, default: 10 },
  itemLabel: { type: String, default: 'results' },
  /* server mode */
  serverSide: { type: Boolean, default: false },
  serverMeta: { type: Object, default: null }
})

const emit = defineEmits(['row-click', 'delete-selected', 'selection-change', 'page-change', 'retry'])

const { t } = useI18n()

const view = ref(props.defaultView)
const fullscreen = ref(false)
const selected = ref([])
const sortKey = ref('')
const sortDir = ref('asc')

/* ------------------------------------------------------------- sorting */
const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const x = a[sortKey.value]
    const y = b[sortKey.value]
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x ?? '').localeCompare(String(y ?? '')) * dir
  })
})

/* ---------------------------------------------------------- pagination */
const pager = usePagination(sortedRows, {
  server: props.serverSide,
  perPage: props.perPage,
  // Any change to the incoming rows (search / filter) resets to page 1.
  watchKeys: [() => props.rows.length, () => props.rows[0]?.[props.rowKey]],
  onChange: (payload) => emit('page-change', payload)
})

watch(
  () => props.serverMeta,
  (meta) => meta && pager.syncFromResponse(meta),
  { immediate: true, deep: true }
)

const visibleRows = computed(() => (props.paginate ? pager.rows.value : sortedRows.value))
const showPagination = computed(() => props.paginate && (pager.total.value > 0 || props.loading))

/* ----------------------------------------------------------- selection */
const pageKeys = computed(() => visibleRows.value.map((r) => r[props.rowKey]))
const allSelected = computed(
  () => pageKeys.value.length > 0 && pageKeys.value.every((k) => selected.value.includes(k))
)

const toggleAll = () => {
  selected.value = allSelected.value
    ? selected.value.filter((k) => !pageKeys.value.includes(k))
    : [...new Set([...selected.value, ...pageKeys.value])]
}

const toggleRow = (id) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id]
}

const clearSelection = () => (selected.value = [])

/* ------------------------------------------------------------- deletion */
const confirmOpen = ref(false)

const emitDelete = () => {
  emit('delete-selected', [...selected.value])
  clearSelection()
}

/** Always ends in the confirmation dialog — a bulk delete is never instant. */
const requestDelete = () => {
  if (props.confirmDelete) confirmOpen.value = true
  else emitDelete()
}

const confirmBulkDelete = () => {
  confirmOpen.value = false
  emitDelete()
}

const bulkTitle = computed(() => props.deleteTitle || t('common.deleteSelected'))
const bulkMessage = computed(() =>
  props.deleteMessage || t('common.deleteSelectedCount', { count: selected.value.length })
)
const bulkLabel = computed(() => props.deleteLabel || t('common.deleteSelected'))

const sortBy = (column) => {
  if (!column.sortable) return
  if (sortKey.value === column.key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = column.key
    sortDir.value = 'asc'
  }
}

const alignClass = (align) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

watch(selected, (value) => emit('selection-change', value))
watch(() => props.rows, () => clearSelection())
watch(fullscreen, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})

const skeletonRows = computed(() => Array.from({ length: Math.min(props.perPage, 6) }, (_, i) => i))

defineExpose({ clearSelection, pager })
</script>

<template>
  <section
    class="card overflow-hidden flex flex-col transition-all duration-200 w-full"
    :class="[panelClass, fullscreen ? 'fixed inset-3 sm:inset-5 z-50 shadow-2xl' : '']"
  >
    <!-- ───────────────────────────── Toolbar ───────────────────────────── -->
    <header
      v-if="title || $slots.toolbar || selectable || allowCardView || allowFullscreen || $slots.actions"
      class="px-3 sm:px-4 py-3 border-b flex flex-col gap-2.5 shrink-0"
      :style="{ borderColor: 'var(--c-border)' }"
    >
      <!--
        ONE ROW on ≥sm: [search ........] [filter] [table|cards] [fullscreen]
        On mobile the search takes its own full-width line and the controls
        sit beneath it, so nothing is ever squeezed below a usable size.
      -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <!-- search / filters grow to fill the row -->
        <div v-if="$slots.toolbar" class="grow min-w-0 order-1">
          <slot name="toolbar" />
        </div>

        <div
          v-if="title && !$slots.toolbar"
          class="grow min-w-0 order-1"
        >
          <h3 class="t-section text-slate-900 dark:text-white truncate">{{ title }}</h3>
          <p v-if="subtitle" class="t-caption text-slate-400 mt-0.5 truncate">{{ subtitle }}</p>
        </div>

        <!-- trailing controls keep a fixed compact width -->
        <div class="flex items-center gap-2 shrink-0 order-2">
          <slot name="actions" />

          <div v-if="allowCardView" class="segmented shrink-0">
            <button data-no-loader
              type="button"
              class="segmented-item gap-1.5"
              :class="view === 'table' ? 'segmented-item-active' : ''"
              :aria-pressed="view === 'table'"
              aria-label="Table view"
              @click="view = 'table'"
            >
              <Icon name="menu" size="w-4 h-4" />
              <span class="hidden lg:inline">Table</span>
            </button>
            <button data-no-loader
              type="button"
              class="segmented-item gap-1.5"
              :class="view === 'cards' ? 'segmented-item-active' : ''"
              :aria-pressed="view === 'cards'"
              aria-label="Card view"
              @click="view = 'cards'"
            >
              <Icon name="layers" size="w-4 h-4" />
              <span class="hidden lg:inline">Cards</span>
            </button>
          </div>

          <button data-no-loader
            v-if="allowFullscreen"
            type="button"
            class="w-9 h-9 grid place-items-center rounded-lg border shrink-0 text-slate-400 transition
                   hover:text-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            :style="{ borderColor: 'var(--c-border)' }"
            :title="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            :aria-label="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            @click="fullscreen = !fullscreen"
          >
            <Icon :name="fullscreen ? 'x' : 'layers'" size="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- bulk selection: its own line so it never squeezes the toolbar -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="selectable && selected.length"
          class="flex items-center gap-2.5 pl-2.5 pr-2 h-12 rounded-xl ring-1 ring-inset"
          :style="{
            background: 'color-mix(in srgb, var(--c-primary) 8%, transparent)',
            '--tw-ring-color': 'color-mix(in srgb, var(--c-primary) 24%, transparent)'
          }"
        >
          <span
            class="w-6 h-6 shrink-0 grid place-items-center rounded-lg text-[11px] font-bold
                   tabular-nums text-white"
            :style="{ background: 'var(--c-primary)' }"
          >
            {{ selected.length }}
          </span>
          <p class="text-[13px] font-semibold truncate" :style="{ color: 'var(--c-primary)' }">
            {{ t('common.selected', { count: selected.length }) }}
          </p>

          <div class="ml-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="h-9 px-3 rounded-lg text-[13px] font-semibold text-slate-500 transition
                     hover:text-slate-800 dark:hover:text-slate-100 hover:bg-surface-subtle
                     focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              @click="clearSelection"
            >
              {{ t('common.clearSelection') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-[13px]
                     font-semibold transition active:scale-[.97] hover:brightness-95
                     focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/25"
              :style="{ background: 'var(--c-danger)' }"
              @click="requestDelete"
            >
              <Icon name="trash" size="w-4 h-4" />
              {{ bulkLabel }}
            </button>
          </div>
        </div>
      </Transition>
    </header>

    <!-- ─────────────────────────── Error ─────────────────────────── -->
    <ErrorState
      v-if="error"
      :description="error"
      min-height="300px"
      @retry="emit('retry')"
    />

    <!-- ─────────────────────────── Table view ─────────────────────────── -->
    <div
      v-show="!error && view === 'table'"
      class="overflow-x-auto grow min-h-0 table-scroll"
      :class="fullscreen ? 'overflow-y-auto' : maxHeight ? `${maxHeight} overflow-y-auto` : ''"
    >
      <table class="w-full text-sm border-separate border-spacing-0" :class="minWidth">
        <thead class="sticky top-0 z-10">
          <tr class="group/head">
            <th v-if="selectable" class="cell-head w-11 !px-4">
              <input
                type="checkbox"
                class="w-[15px] h-[15px] rounded accent-brand-600 cursor-pointer align-middle"
                :checked="allSelected"
                aria-label="Select all rows on this page"
                @change="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              class="cell-head select-none"
              :class="[
                alignClass(col.align),
                col.width,
                col.sticky ? 'cell-sticky' : '',
                col.sortable ? 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' : ''
              ]"
              :aria-sort="sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
              @click="sortBy(col)"
            >
              <span
                class="inline-flex items-center gap-1"
                :class="col.align === 'right' ? 'flex-row-reverse' : ''"
              >
                {{ col.label }}
                <Icon
                  v-if="col.sortable"
                  :name="sortKey === col.key && sortDir === 'desc' ? 'arrowDown' : 'arrowUp'"
                  size="w-3 h-3"
                  class="transition-opacity"
                  :class="sortKey === col.key ? 'text-brand-600 opacity-100' : 'opacity-0 group-hover/head:opacity-40'"
                />
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading skeleton -->
          <tr v-if="loading" v-for="n in skeletonRows" :key="`sk-${n}`">
            <td v-if="selectable" class="cell !px-4 border-b" :style="{ borderColor: 'var(--c-border)' }">
              <span class="block w-[15px] h-[15px] rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </td>
            <td
              v-for="col in columns"
              :key="`sk-${n}-${col.key}`"
              class="cell border-b"
              :style="{ borderColor: 'var(--c-border)' }"
            >
              <span
                class="block h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"
                :style="{ width: `${45 + ((n * 17 + col.key.length * 7) % 45)}%` }"
              />
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-else
            v-for="row in visibleRows"
            :key="row[rowKey]"
            class="table-row group last:[&>td]:border-b-0"
            :class="[
              clickable ? 'cursor-pointer' : '',
              selected.includes(row[rowKey]) ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''
            ]"
            @click="clickable && emit('row-click', row)"
          >
            <td
              v-if="selectable"
              class="cell !px-4 border-b"
              :style="{ borderColor: 'var(--c-border)' }"
              @click.stop
            >
              <input
                type="checkbox"
                class="w-[15px] h-[15px] rounded accent-brand-600 cursor-pointer align-middle"
                :checked="selected.includes(row[rowKey])"
                @change="toggleRow(row[rowKey])"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              class="cell border-b text-[13.5px] text-slate-600 dark:text-slate-300"
              :class="[alignClass(col.align), col.sticky ? 'cell-sticky' : '']"
              :style="{ borderColor: 'var(--c-border)' }"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-if="!loading && !visibleRows.length">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-5 py-20 text-center">
              <span
                class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400
                       flex items-center justify-center"
              >
                <Icon :name="emptyIcon" size="w-6 h-6" />
              </span>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
                {{ emptyText || 'No records found' }}
              </p>
              <p class="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              <div v-if="$slots.empty" class="mt-4"><slot name="empty" /></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─────────────────────────── Card view ──────────────────────────── -->
    <div
      v-show="!error && view === 'cards'"
      class="grow min-h-0 overflow-y-auto p-4"
      :class="fullscreen ? '' : maxHeight"
    >
      <div v-if="loading" class="grid gap-3" :class="cardColumns">
        <div
          v-for="n in skeletonRows"
          :key="`skc-${n}`"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 min-h-[150px] animate-pulse"
        >
          <div class="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 mb-3" />
          <div class="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
          <div class="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="grid gap-3" :class="cardColumns">
        <article
          v-for="row in visibleRows"
          :key="row[rowKey]"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4
                 card-hover min-h-[150px] flex flex-col"
          :class="clickable ? 'cursor-pointer' : ''"
          @click="clickable && emit('row-click', row)"
        >
          <slot name="card" :row="row">
            <div class="flex items-start gap-2 mb-3">
              <input
                v-if="selectable"
                type="checkbox"
                class="w-4 h-4 mt-0.5 rounded accent-brand-600"
                :checked="selected.includes(row[rowKey])"
                @click.stop
                @change="toggleRow(row[rowKey])"
              />
              <div class="grow min-w-0">
                <slot :name="`cell-${columns[0].key}`" :row="row" :value="row[columns[0].key]">
                  <p class="font-semibold text-slate-900 dark:text-white truncate">
                    {{ row[columns[0].key] }}
                  </p>
                </slot>
              </div>
            </div>
            <dl class="space-y-1.5 text-sm grow">
              <div
                v-for="col in columns.slice(1).filter((c) => !c.cardHide)"
                :key="col.key"
                class="flex items-center justify-between gap-3"
              >
                <dt class="text-xs text-slate-400 shrink-0">{{ col.label }}</dt>
                <dd class="text-right text-slate-700 dark:text-slate-200 truncate">
                  <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                    {{ row[col.key] }}
                  </slot>
                </dd>
              </div>
            </dl>
          </slot>
        </article>
      </TransitionGroup>

      <div v-if="!loading && !visibleRows.length" class="py-20 text-center">
        <span
          class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400
                 flex items-center justify-center"
        >
          <Icon :name="emptyIcon" size="w-6 h-6" />
        </span>
        <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
          {{ emptyText || 'No records found' }}
        </p>
      </div>
    </div>

    <!-- ─────────────────────────── Pagination ─────────────────────────── -->
    <Pagination
      v-if="showPagination && !error"
      v-model:page="pager.page.value"
      :per-page="pager.perPage.value"
      :total="pager.total.value"
      :last-page="pager.lastPage.value"
      :from="pager.from.value"
      :to="pager.to.value"
      :loading="loading"
      :label="itemLabel"
      @update:per-page="pager.setPerPage"
    />

    <footer
      v-if="$slots.footer"
      class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0"
    >
      <slot name="footer" />
    </footer>
  </section>

  <!-- One confirmation design for every bulk delete in the app -->
  <ConfirmDialog
    :open="confirmOpen"
    :title="bulkTitle"
    :confirm-label="bulkLabel"
    :cancel-label="t('common.cancel')"
    :count="0"
    @close="confirmOpen = false"
    @confirm="confirmBulkDelete"
  >
    {{ bulkMessage }}
  </ConfirmDialog>

  <Transition name="fade">
    <div
      v-if="fullscreen"
      class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
      @click="fullscreen = false"
    />
  </Transition>
</template>
