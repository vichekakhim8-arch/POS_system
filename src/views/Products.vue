<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import FilterPanel from '@/components/ui/FilterPanel.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import ProductThumb from '@/components/ui/ProductThumb.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const router = useRouter()
const products = useProductsStore()
const settings = useSettingsStore()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

const viewing = ref(null)
const deleting = ref(null)
const filtersOpen = ref(false)

const { loading, error, reload } = useAsyncView('products')
const { run } = useAction()

const activeFilterCount = computed(
  () => [products.category, products.status].filter((v) => v !== 'All').length
)

/** Removable chips shown under the search bar. */
const filterChips = computed(() => {
  const chips = []
  if (products.category !== 'All')
    chips.push({ key: 'category', group: 'Category', label: products.category })
  if (products.status !== 'All')
    chips.push({ key: 'status', group: 'Status', label: products.status })
  if (products.search.trim())
    chips.push({ key: 'search', group: 'Search', label: products.search.trim() })
  return chips
})

const removeChip = (chip) => {
  if (chip.key === 'category') products.setCategory('All')
  if (chip.key === 'status') products.setStatus('All')
  if (chip.key === 'search') products.setSearch('')
}

const columns = computed(() => [
  { key: 'name', label: t('nav.products'), sortable: true },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: t('common.category'), sortable: true },
  { key: 'price', label: t('common.price'), align: 'right', sortable: true },
  { key: 'cost', label: t('common.cost'), align: 'right', sortable: true },
  { key: 'stock', label: t('common.stock'), align: 'right', sortable: true },
  { key: 'status', label: t('common.status') },
  { key: 'actions', label: t('common.actions'), align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'name', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'cost', label: 'Cost', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'lowStock', label: 'Low stock alert', align: 'right' },
  { key: 'status', label: 'Status' }
]

const stockClass = (product) =>
  product.stock <= 0
    ? 'text-rose-500 font-bold'
    : product.stock <= product.lowStock
      ? 'text-amber-500 font-bold'
      : 'text-slate-700 dark:text-slate-200'

const confirmDelete = async () => {
  const product = deleting.value
  await run(() => products.removeProduct(product.id), { message: t('common.deleting') })
  ui.notify(`${product.name} ${t('common.delete')}`)
  deleting.value = null
}

const confirmBulkDelete = async (ids) => {
  await run(() => ids.forEach((id) => products.removeProduct(id)), { message: t('common.deleting') })
  ui.notify(t('common.deletedCount', { count: ids.length }))
}

const onImport = (rows) => {
  let created = 0
  rows.forEach((row) => {
    const name = row.Product || row.name || row.Name
    if (!name) return
    products.addProduct({
      name,
      sku: row.SKU || row.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: row.Category || row.category || products.categoryNames[0],
      price: Number(row.Price || row.price || 0),
      cost: Number(row.Cost || row.cost || 0),
      stock: Number(row.Stock || row.stock || 0),
      lowStock: Number(row['Low stock alert'] || row.lowStock || settings.lowStockDefault),
      status: row.Status || 'Active',
      description: row.Description || ''
    })
    created++
  })
  ui.notify(`${created} products imported`)
}

const margin = (product) =>
  product.price > 0 ? `${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%` : '—'
</script>

<template>
  <div>
    <PageHeader
      icon="box"
      :title="t('nav.products')"
      :subtitle="`${products.filtered.length} / ${products.total}`"
    >
      <template #actions>
        <ExportMenu
          filename="products"
          :title="t('nav.products')"
          :columns="exportColumns"
          :rows="products.filtered"
          :formats="['excel', 'csv']"
          allow-import
          @imported="onImport"
        />
        <Button variant="secondary" icon="tag" @click="router.push('/categories')">
          {{ t('nav.categories') }}
        </Button>
        <Button v-if="auth.can('manageProducts')" icon="plus" @click="router.push('/products/new')">
          {{ t('common.add') }}
        </Button>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="products.filtered"
      :selectable="auth.can('manageProducts')"
      confirm-delete
      :delete-title="t('products.deleteSelected')"
      :delete-message="t('products.deleteSelectedHint')"
      paginate
      :loading="loading"
      :error="error"
      :per-page="10"
      item-label="products"
      min-width="min-w-[940px]"
      max-height="max-h-[calc(100vh-420px)] min-h-[320px]"
      empty-icon="box"
      card-columns="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      @delete-selected="confirmBulkDelete"
      @retry="reload"
    >
      <template #toolbar>
        <FilterPanel
          v-model:open="filtersOpen"
          :active-count="activeFilterCount"
          :chips="filterChips"
          @reset="products.resetFilters()"
          @remove-chip="removeChip"
        >
          <template #search>
            <Input
              :model-value="products.search"
              icon="search"
              :placeholder="t('common.searchPlaceholder')"
              @update:model-value="products.setSearch($event)"
            />
          </template>

          <Select
            :model-value="products.category"
            label="Category"
            :options="products.categoryTabs"
            @update:model-value="products.setCategory($event)"
          />
          <Select
            :model-value="products.status"
            label="Status"
            :options="['All', 'Active', 'Inactive']"
            @update:model-value="products.setStatus($event)"
          />
        </FilterPanel>
      </template>

      <!-- SKU has its own column — no duplicate caption here -->
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <ProductThumb :src="row.image" :alt="row.name" />
          <p class="font-medium text-slate-900 dark:text-white truncate">{{ row.name }}</p>
        </div>
      </template>

      <template #cell-sku="{ row }">
        <span class="font-mono text-xs text-slate-500">{{ row.sku }}</span>
      </template>

      <template #cell-price="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.price) }}</span>
      </template>

      <template #cell-cost="{ row }">{{ settings.money(row.cost) }}</template>

      <!-- stock reads as a badge, never colour alone -->
      <template #cell-stock="{ row }">
        <span
          v-if="row.stock <= 0"
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold"
          :style="{ background: 'color-mix(in srgb, var(--c-danger) 12%, transparent)', color: 'var(--c-danger)' }"
        >
          Out of stock
        </span>
        <span
          v-else-if="row.stock <= row.lowStock"
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold"
          :style="{ background: 'color-mix(in srgb, var(--c-warning) 14%, transparent)', color: 'var(--c-warning)' }"
        >
          <Icon name="alert" size="w-3 h-3" />
          Low stock ({{ row.stock }})
        </span>
        <span v-else class="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {{ row.stock }}
        </span>
      </template>

      <template #cell-status="{ row }"><Badge :type="row.status" dot /></template>

      <template #cell-actions="{ row }">
        <RowActions
          show-view
          :show-edit="auth.can('manageProducts')"
          :show-delete="auth.can('manageProducts')"
          :view-label="t('common.view')"
          :edit-label="t('common.edit')"
          :delete-label="t('common.delete')"
          @view="viewing = row"
          @edit="router.push(`/products/${row.id}/edit`)"
          @delete="deleting = row"
        />
      </template>

      <!-- Card view -->
      <template #card="{ row }">
        <div class="flex gap-3">
          <img :src="row.image" :alt="row.name" class="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" />
          <div class="min-w-0 grow">
            <p class="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">{{ row.name }}</p>
            <p class="text-xs text-slate-400 font-mono mt-0.5">{{ row.sku }}</p>
            <Badge :type="row.status" size="sm" class="mt-1.5" />
          </div>
        </div>
        <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <dt class="text-[10px] text-slate-400">{{ t('common.price') }}</dt>
            <dd class="text-sm font-bold text-brand-600">{{ settings.money(row.price) }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <dt class="text-[10px] text-slate-400">{{ t('common.cost') }}</dt>
            <dd class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ settings.money(row.cost) }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <dt class="text-[10px] text-slate-400">{{ t('common.stock') }}</dt>
            <dd class="text-sm font-bold" :class="stockClass(row)">{{ row.stock }}</dd>
          </div>
        </dl>
        <div class="mt-3 flex gap-1.5">
          <Button variant="secondary" size="sm" block icon="eye" @click.stop="viewing = row">
            {{ t('common.view') }}
          </Button>
          <Button variant="secondary" size="sm" block icon="edit" @click.stop="router.push(`/products/${row.id}/edit`)">
            {{ t('common.edit') }}
          </Button>
        </div>
      </template>
    </DataTable>

    <!-- detail -->
    <Modal :open="!!viewing" :title="t('common.view')" @close="viewing = null">
      <div v-if="viewing" class="flex flex-col sm:flex-row gap-5">
        <img :src="viewing.image" :alt="viewing.name" class="w-full sm:w-40 h-40 rounded-2xl object-cover bg-slate-100" />
        <div class="grow">
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">{{ viewing.name }}</h4>
          <p class="text-sm text-slate-500 mt-1">{{ viewing.description }}</p>
          <dl class="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div><dt class="text-xs text-slate-400">SKU</dt><dd class="font-medium text-slate-800 dark:text-slate-100">{{ viewing.sku }}</dd></div>
            <div><dt class="text-xs text-slate-400">{{ t('common.category') }}</dt><dd class="font-medium text-slate-800 dark:text-slate-100">{{ viewing.category }}</dd></div>
            <div><dt class="text-xs text-slate-400">{{ t('common.price') }}</dt><dd class="font-medium text-brand-600">{{ settings.money(viewing.price) }}</dd></div>
            <div><dt class="text-xs text-slate-400">{{ t('common.cost') }}</dt><dd class="font-medium text-slate-800 dark:text-slate-100">{{ settings.money(viewing.cost) }}</dd></div>
            <div><dt class="text-xs text-slate-400">{{ t('common.stock') }}</dt><dd class="font-medium text-slate-800 dark:text-slate-100">{{ viewing.stock }}</dd></div>
            <div><dt class="text-xs text-slate-400">Margin</dt><dd class="font-medium text-emerald-600">{{ margin(viewing) }}</dd></div>
          </dl>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="viewing = null">{{ t('common.close') }}</Button>
          <Button block icon="edit" @click="router.push(`/products/${viewing.id}/edit`)">{{ t('common.edit') }}</Button>
        </div>
      </template>
    </Modal>

    <!-- single delete -->
    <ConfirmDialog
      :open="!!deleting"
      :title="t('products.deleteTitle')"
      :message="`“${deleting?.name}” ${t('products.deleteHint')}`"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
