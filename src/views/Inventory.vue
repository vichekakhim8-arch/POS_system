<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Modal from '@/components/ui/Modal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import RowActions from '@/components/ui/RowActions.vue'
import ProductThumb from '@/components/ui/ProductThumb.vue'
import { useProductsStore } from '@/stores/products'
import { useInventoryStore } from '@/stores/inventory'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const products = useProductsStore()
const inventory = useInventoryStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()

const tab = ref('all')
const search = ref('')

const { loading, error, reload } = useAsyncView('inventory')
const { run } = useAction()

const tabs = computed(() => [
  { key: 'all', label: t('common.stock'), count: products.items.length },
  { key: 'low', label: t('dashboard.lowStock'), count: products.lowStock.length },
  { key: 'out', label: t('pos.outOfStock'), count: products.outOfStock.length }
])

const rows = computed(() => {
  const source =
    tab.value === 'low' ? products.lowStock : tab.value === 'out' ? products.outOfStock : products.items
  const term = search.value.trim().toLowerCase()
  const list = term
    ? source.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    : source
  return list.map((p) => ({ ...p, value: p.stock * p.cost }))
})

/** Stock health → one token, reused by the pill and its tooltip. */
const stockTone = (row) =>
  row.stock <= 0
    ? 'var(--c-danger)'
    : row.stock <= row.lowStock
      ? 'var(--c-warning)'
      : 'var(--c-success)'

const stockLabel = (row) =>
  row.stock <= 0 ? 'Out of stock' : row.stock <= row.lowStock ? 'Low stock' : 'In stock'

const columns = computed(() => [
  { key: 'name', label: t('nav.products'), sortable: true },
  { key: 'sku', label: 'SKU' },
  { key: 'stock', label: t('common.stock'), align: 'right', sortable: true },
  { key: 'lowStock', label: 'Alert at', align: 'right' },
  { key: 'value', label: 'Stock value', align: 'right', sortable: true },
  { key: 'actions', label: t('common.actions'), align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'name', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'lowStock', label: 'Low stock alert', align: 'right' },
  { key: 'cost', label: 'Unit cost', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'value', label: 'Stock value', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'status', label: 'Status' }
]

/* ───────── Stock In / Out — handled inline, no page navigation ───────── */
const move = reactive({ open: false, type: 'in', productId: '', qty: 1, reason: '' })

const REASONS_OUT = ['Damaged / loss', 'Expired', 'Internal use', 'Return to supplier', 'Correction']

const openMove = (type, product = null) => {
  Object.assign(move, {
    open: true,
    type,
    productId: String(product?.id ?? products.items[0]?.id ?? ''),
    qty: type === 'in' ? 10 : 1,
    reason: type === 'in' ? 'Purchase received' : REASONS_OUT[0]
  })
}

const moveProduct = computed(() => products.byId(move.productId))
const moveAfter = computed(() => {
  if (!moveProduct.value) return 0
  const delta = Number(move.qty) || 0
  return move.type === 'in'
    ? moveProduct.value.stock + delta
    : Math.max(0, moveProduct.value.stock - delta)
})

const submitMove = async () => {
  const { type, productId, qty, reason } = move
  let result
  await run(
    () => {
      result =
        type === 'in'
          ? inventory.receive(Number(productId), qty, reason || 'Stock in')
          : inventory.issue(Number(productId), qty, reason || 'Stock out')
    },
    { message: t('common.saving') }
  )
  ui.notify(result.message, result.ok ? 'success' : 'error')
  if (result.ok) move.open = false
}

const productOptions = computed(() =>
  products.items.map((p) => ({ value: String(p.id), label: `${p.name} — ${p.stock} in stock` }))
)

const movementColumns = [
  { key: 'date', label: 'Date' },
  { key: 'product', label: 'Product' },
  { key: 'type', label: 'Type', format: (v) => (v === 'in' ? 'Stock In' : 'Stock Out') },
  { key: 'qty', label: 'Quantity', align: 'right' },
  { key: 'reason', label: 'Reason' },
  { key: 'by', label: 'Recorded by' }
]
</script>

<template>
  <div>
    <PageHeader icon="layers" :title="t('nav.inventory')" subtitle="Stock levels, movements and valuation">
      <template #actions>
        <ExportMenu
          filename="inventory-current-stock"
          :title="`${t('nav.inventory')} — ${tabs.find((x) => x.key === tab).label}`"
          :columns="exportColumns"
          :rows="rows"
          :summary="[['Stock value', settings.money(products.stockValue)]]"
          orientation="landscape"
        />
        <Button variant="secondary" icon="arrowUp" @click="openMove('out')">{{ t('nav.stockOut') }}</Button>
        <Button icon="arrowDown" @click="openMove('in')">{{ t('nav.stockIn') }}</Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 stagger">
      <StatCard
        :label="t('dashboard.totalProducts')"
        :amount="products.total"
        icon="box"
        :loading="loading"
      />
      <StatCard
        label="Stock value"
        :amount="products.stockValue"
        :decimals="2"
        :prefix="settings.currency"
        icon="dollar"
        tone="emerald"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.lowStock')"
        :amount="products.lowStock.length"
        icon="alert"
        tone="amber"
        :loading="loading"
      />
      <StatCard
        :label="t('pos.outOfStock')"
        :amount="products.outOfStock.length"
        icon="x"
        tone="rose"
        :loading="loading"
      />
    </div>

    <div class="grid xl:grid-cols-3 gap-5">
      <div class="xl:col-span-2">
        <DataTable
          :columns="columns"
          :rows="rows"
          paginate
          :loading="loading"
          :error="error"
          :per-page="10"
          item-label="products"
          min-width="min-w-[720px]"
          max-height="max-h-[560px]"
          empty-icon="layers"
          card-columns="sm:grid-cols-2"
          @retry="reload"
        >
          <template #toolbar>
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div class="segmented">
                <button
                  v-for="x in tabs"
                  :key="x.key"
                  class="segmented-item"
                  :class="tab === x.key ? 'segmented-item-active' : ''"
                  @click="tab = x.key"
                >
                  {{ x.label }} ({{ x.count }})
                </button>
              </div>
              <Input v-model="search" icon="search" :placeholder="t('common.searchPlaceholder')" class="sm:w-56" />
            </div>
          </template>

          <template #cell-name="{ row }">
            <div class="flex items-center gap-3">
              <ProductThumb :src="row.image" :alt="row.name" />
              <div class="min-w-0">
                <p class="font-medium text-slate-900 dark:text-white truncate">{{ row.name }}</p>
                <p class="text-xs text-slate-400">{{ row.category }}</p>
              </div>
            </div>
          </template>

          <template #cell-sku="{ row }">
            <span class="font-mono text-xs text-slate-500">{{ row.sku }}</span>
          </template>

          <!-- stock pill: colour + label, never colour alone -->
          <template #cell-stock="{ row }">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[12px] font-bold tabular-nums"
              :style="{
                background: `color-mix(in srgb, ${stockTone(row)} 13%, transparent)`,
                color: stockTone(row)
              }"
              :title="stockLabel(row)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ background: stockTone(row) }" />
              {{ row.stock }}
            </span>
          </template>

          <template #cell-value="{ row }">
            <span class="tabular-nums">{{ settings.money(row.value) }}</span>
          </template>

          <!-- quick stock adjustment -->
          <template #cell-actions="{ row }">
            <RowActions>
              <!-- stock movements are the row's real actions, so they keep their
                   own colour-coded targets inside the shared group -->
              <button
                type="button"
                class="w-[34px] h-[34px] grid place-items-center rounded-lg transition text-slate-400
                       hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                :title="`${t('nav.stockIn')} - ${row.name}`"
                :aria-label="`${t('nav.stockIn')} for ${row.name}`"
                @click="openMove('in', row)"
              >
                <Icon name="plus" size="w-4 h-4" stroke-width="2.5" />
              </button>
              <button
                type="button"
                class="w-[34px] h-[34px] grid place-items-center rounded-lg transition text-slate-400
                       hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20"
                :title="row.stock <= 0 ? 'No stock to remove' : `${t('nav.stockOut')} - ${row.name}`"
                :aria-label="`${t('nav.stockOut')} for ${row.name}`"
                :disabled="row.stock <= 0"
                @click="openMove('out', row)"
              >
                <Icon name="minus" size="w-4 h-4" stroke-width="2.5" />
              </button>
            </RowActions>
          </template>
        </DataTable>
      </div>

      <div class="card overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">Stock history</h3>
            <p class="text-xs text-slate-500">
              +{{ inventory.totalIn }} in · −{{ inventory.totalOut }} out
            </p>
          </div>
          <ExportMenu
            filename="stock-movements"
            title="Stock movements"
            :columns="movementColumns"
            :rows="inventory.movements"
            :formats="['excel', 'csv']"
            size="sm"
          />
        </div>
        <ul class="max-h-[560px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="movement in inventory.recent" :key="movement.id" class="px-5 py-3 flex items-start gap-3">
            <span
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :class="
                movement.type === 'in'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
              "
            >
              <Icon :name="movement.type === 'in' ? 'arrowDown' : 'arrowUp'" size="w-4 h-4" />
            </span>
            <div class="min-w-0 grow">
              <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ movement.product }}</p>
              <p class="text-xs text-slate-400">{{ movement.reason }} · {{ movement.date }}</p>
            </div>
            <span
              class="text-sm font-bold shrink-0"
              :class="movement.type === 'in' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ movement.type === 'in' ? '+' : '−' }}{{ movement.qty }}
            </span>
           </li>
        </ul>
      </div>
    </div>

    <!-- ════════ Stock In / Stock Out (inline, no page change) ════════ -->
    <Modal
      :open="move.open"
      :title="move.type === 'in' ? t('nav.stockIn') : t('nav.stockOut')"
      :subtitle="move.type === 'in' ? 'Receive stock into inventory' : 'Remove stock for damage, loss or internal use'"
      size="max-w-md"
      @close="move.open = false"
    >
      <div class="space-y-4">
        <Select v-model="move.productId" :label="t('nav.products')" :options="productOptions" />
        <Input v-model.number="move.qty" :label="t('common.quantity')" type="number" min="1" required />

        <Select
          v-if="move.type === 'out'"
          v-model="move.reason"
          label="Reason"
          :options="REASONS_OUT"
        />
        <Input v-else v-model="move.reason" label="Reason / reference" placeholder="Purchase received" />

        <div v-if="moveProduct" class="rounded-2xl p-4" :style="{ background: 'var(--c-subtle)' }">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Current stock</span>
            <span class="font-semibold text-slate-900 dark:text-white tabular-nums">
              {{ moveProduct.stock }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
            <span class="text-slate-500">After this entry</span>
            <span
              class="text-lg font-bold tabular-nums"
              :style="{ color: move.type === 'in' ? 'var(--c-success)' : 'var(--c-danger)' }"
            >
              {{ moveAfter }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="move.open = false">{{ t('common.cancel') }}</Button>
          <Button
            block
            :variant="move.type === 'in' ? 'primary' : 'danger'"
            :icon="move.type === 'in' ? 'arrowDown' : 'arrowUp'"
            @click="submitMove"
          >
            {{ t('common.confirm') }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
