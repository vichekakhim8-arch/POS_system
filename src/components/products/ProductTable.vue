<script setup>
import DataTable from '@/components/ui/DataTable.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import { useSettingsStore } from '@/stores/settings'

defineProps({
  products: { type: Array, default: () => [] }
})

defineEmits(['view', 'edit', 'delete'])

const settings = useSettingsStore()

const columns = [
  { key: 'name', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'cost', label: 'Cost', align: 'right' },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' }
]

const stockClass = (product) =>
  product.stock <= 0
    ? 'text-rose-500 font-semibold'
    : product.stock <= product.lowStock
      ? 'text-amber-500 font-semibold'
      : 'text-slate-700 dark:text-slate-200'
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="products"
    min-width="min-w-[900px]"
    empty-text="No products match the current filters."
    empty-icon="box"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <img :src="row.image" :alt="row.name" class="w-10 h-10 rounded-lg object-cover bg-slate-100" />
        <span class="font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
      </div>
    </template>

    <template #cell-sku="{ row }">
      <span class="font-mono text-xs text-slate-500">{{ row.sku }}</span>
    </template>

    <template #cell-price="{ row }">
      <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.price) }}</span>
    </template>

    <template #cell-cost="{ row }">{{ settings.money(row.cost) }}</template>

    <template #cell-stock="{ row }">
      <span :class="stockClass(row)">{{ row.stock }}</span>
    </template>

    <template #cell-status="{ row }">
      <Badge :type="row.status" />
    </template>

    <template #cell-actions="{ row }">
      <div class="flex items-center justify-end gap-1">
        <button class="icon-btn" title="View" @click.stop="$emit('view', row)">
          <Icon name="eye" size="w-4 h-4" />
        </button>
        <button class="icon-btn" title="Edit" @click.stop="$emit('edit', row)">
          <Icon name="edit" size="w-4 h-4" />
        </button>
        <button class="icon-btn-danger" title="Delete" @click.stop="$emit('delete', row)">
          <Icon name="trash" size="w-4 h-4" />
        </button>
      </div>
    </template>
  </DataTable>
</template>
