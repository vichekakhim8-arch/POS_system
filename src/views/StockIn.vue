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

const form = reactive({
  productId: route.query.product ? String(route.query.product) : String(products.items[0]?.id ?? ''),
  qty: 10,
  reason: 'Purchase received'
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
    result = inventory.receive(Number(productId), qty, reason || 'Stock in')
  }, { message: t('common.saving') })
  ui.notify(result.message, result.ok ? 'success' : 'error')
  if (result.ok) form.qty = 10
}
</script>

<template>
  <div>
    <PageHeader :title="t('nav.stockIn')" subtitle="Receive new stock into inventory" back-to="/inventory">
      <template #actions>
        <ExportMenu
          filename="stock-in"
          :title="t('nav.stockIn')"
          :columns="columns"
          :rows="inventory.stockIn"
          :formats="['excel', 'csv']"
        />
        <Button variant="secondary" icon="arrowUp" @click="router.push('/inventory/stock-out')">
          {{ t('nav.stockOut') }}
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      <StatCard label="Total received" :amount="inventory.totalIn" icon="arrowDown" tone="emerald" />
      <StatCard label="Entries" :amount="inventory.stockIn.length" icon="clipboard" />
      <StatCard :label="t('dashboard.lowStock')" :amount="products.lowStock.length" icon="alert" tone="amber" />
    </div>

    <div class="grid lg:grid-cols-3 gap-5">
      <form class="card p-5 space-y-4 h-fit" @submit.prevent="submit">
        <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('nav.stockIn') }}</h3>
        <Select v-model="form.productId" :label="t('nav.products')" :options="options" />
        <Input v-model.number="form.qty" :label="t('common.quantity')" type="number" min="1" />
        <Input v-model="form.reason" label="Reason / reference" />

        <div v-if="selected" class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3.5 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Current</span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ selected.stock }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">After entry</span>
            <span class="font-bold text-emerald-600">{{ selected.stock + Number(form.qty || 0) }}</span>
          </div>
        </div>

        <Button type="submit" block icon="arrowDown">{{ t('common.confirm') }}</Button>
      </form>

      <div class="lg:col-span-2">
        <DataTable
          :title="`${t('nav.stockIn')} history`"
          :columns="columns"
          :rows="inventory.stockIn"
          row-key="id"
          min-width="min-w-[620px]"
          max-height="max-h-[560px]"
          empty-icon="arrowDown"
        >
          <template #cell-product="{ row }">
            <span class="font-medium text-slate-900 dark:text-white">{{ row.product }}</span>
          </template>
          <template #cell-qty="{ row }">
            <span class="font-bold text-emerald-600">+{{ row.qty }}</span>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>
