<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useProductsStore } from '@/stores/products'
import { useInventoryStore } from '@/stores/inventory'
import { useUiStore } from '@/stores/ui'
import { useAction } from '@/composables/useAction'

const route = useRoute()
const router = useRouter()
const products = useProductsStore()
const inventory = useInventoryStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const reasons = ['Damaged / loss', 'Expired', 'Internal use', 'Return to supplier', 'Correction']

const form = reactive({
  productId: route.query.product ? String(route.query.product) : String(products.items[0]?.id ?? ''),
  qty: 1,
  reason: reasons[0]
})

const options = computed(() =>
  products.items.map((p) => ({ value: String(p.id), label: `${p.name} — ${p.stock} in stock` }))
)
const selected = computed(() => products.byId(form.productId))

const columns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'product', label: 'Product', sortable: true },
  { key: 'qty', label: 'Quantity', align: 'right', sortable: true },
  { key: 'reason', label: 'Reason' },
  { key: 'by', label: 'Recorded by' }
]

const submit = async () => {
  const { productId, qty, reason } = form
  let result
  await run(() => {
    result = inventory.issue(Number(productId), qty, reason)
  }, { message: t('common.saving') })
  ui.notify(result.message, result.ok ? 'success' : 'error')
  if (result.ok) form.qty = 1
}
</script>

<template>
  <div>
    <PageHeader
      :title="t('nav.stockOut')"
      subtitle="Remove stock for damage, loss or internal use"
      back-to="/inventory"
    >
      <template #actions>
        <ExportMenu
          filename="stock-out"
          :title="t('nav.stockOut')"
          :columns="columns"
          :rows="inventory.stockOut"
          :formats="['excel', 'csv']"
        />
        <Button variant="secondary" icon="arrowDown" @click="router.push('/inventory/stock-in')">
          {{ t('nav.stockIn') }}
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      <StatCard label="Total issued" :amount="inventory.totalOut" icon="arrowUp" tone="rose" />
      <StatCard label="Entries" :amount="inventory.stockOut.length" icon="clipboard" />
      <StatCard :label="t('pos.outOfStock')" :amount="products.outOfStock.length" icon="x" tone="amber" />
    </div>

    <div class="grid lg:grid-cols-3 gap-5">
      <form class="card p-5 space-y-4 h-fit" @submit.prevent="submit">
        <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('nav.stockOut') }}</h3>
        <Select v-model="form.productId" :label="t('nav.products')" :options="options" />
        <Input v-model.number="form.qty" :label="t('common.quantity')" type="number" min="1" />
        <Select v-model="form.reason" label="Reason" :options="reasons" />

        <div v-if="selected" class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3.5 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Current</span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ selected.stock }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">After entry</span>
            <span class="font-bold text-rose-600">
              {{ Math.max(0, selected.stock - Number(form.qty || 0)) }}
            </span>
          </div>
        </div>

        <Button type="submit" variant="danger" block icon="arrowUp">{{ t('common.confirm') }}</Button>
      </form>

      <div class="lg:col-span-2">
        <DataTable
          :title="`${t('nav.stockOut')} history`"
          :columns="columns"
          :rows="inventory.stockOut"
          row-key="id"
          min-width="min-w-[620px]"
          max-height="max-h-[560px]"
          empty-icon="arrowUp"
        >
          <template #cell-product="{ row }">
            <span class="font-medium text-slate-900 dark:text-white">{{ row.product }}</span>
          </template>
          <template #cell-qty="{ row }">
            <span class="font-bold text-rose-600">−{{ row.qty }}</span>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>
