<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import StatCard from '@/components/ui/StatCard.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { round2 } from '@/utils/helpers'
import { useAction } from '@/composables/useAction'

const suppliers = useSuppliersStore()
const products = useProductsStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const open = ref(false)
const detail = ref(null)

const draft = reactive({
  supplierId: String(suppliers.items[0]?.id ?? ''),
  productId: String(products.items[0]?.id ?? ''),
  qty: 10,
  cost: products.items[0]?.cost ?? 0,
  items: []
})

watch(
  () => draft.productId,
  (id) => {
    const product = products.byId(id)
    if (product) draft.cost = product.cost
  }
)

const draftTotal = computed(() => round2(draft.items.reduce((s, i) => s + i.cost * i.qty, 0)))

const supplierOptions = computed(() =>
  suppliers.items.map((s) => ({ value: String(s.id), label: s.name }))
)
const productOptions = computed(() =>
  products.items.map((p) => ({ value: String(p.id), label: p.name }))
)

const columns = [
  { key: 'id', label: 'PO number' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'date', label: 'Date' },
  { key: 'count', label: 'Items', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'actions', label: '', align: 'right', sticky: true }
]

const rows = computed(() =>
  suppliers.purchases.map((purchase) => ({ ...purchase, count: purchase.items.length }))
)

const addLine = () => {
  const product = products.byId(draft.productId)
  if (!product) return ui.notify('Select a product', 'error')
  if (!(draft.qty > 0)) return ui.notify('Quantity must be greater than zero', 'error')
  draft.items.push({
    id: product.id,
    name: product.name,
    qty: Number(draft.qty),
    cost: Number(draft.cost) || 0
  })
}

const removeLine = (index) => draft.items.splice(index, 1)

const confirmPurchase = async () => {
  const payload = { supplierId: Number(draft.supplierId), items: draft.items }
  let result
  await run(() => {
    result = suppliers.createPurchase(payload)
  }, { message: t('common.saving') })
  if (!result.ok) return ui.notify(result.message, 'error')
  draft.items = []
  open.value = false
  ui.notify(result.message)
}
</script>

<template>
  <div>
    <PageHeader icon="cart" title="Purchases" subtitle="Create purchase orders and receive stock from suppliers">
      <template #actions>
        <ExportMenu
          filename="purchases"
          title="Purchase orders"
          :columns="[
            { key: 'id', label: 'PO number' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'date', label: 'Date' },
            { key: 'count', label: 'Items', align: 'right' },
            { key: 'status', label: 'Status' },
            { key: 'total', label: 'Total', align: 'right', format: (v) => Number(v).toFixed(2) }
          ]"
          :rows="rows"
          :summary="[['Total purchased', settings.money(suppliers.purchaseTotal)]]"
        />
        <Button icon="plus" @click="open = true">New purchase</Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <StatCard label="Purchase orders" :value="suppliers.purchases.length" icon="clipboard" />
      <StatCard label="Total purchased" :value="settings.money(suppliers.purchaseTotal)" icon="dollar" tone="emerald" />
      <StatCard label="Pending orders" :value="suppliers.pendingPurchases.length" icon="alert" tone="amber" />
      <StatCard label="Suppliers" :value="suppliers.items.length" icon="truck" tone="sky" />
    </div>

    <DataTable :columns="columns" :rows="rows" min-width="min-w-[780px]" empty-icon="cart">
      <template #cell-id="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ row.id }}</span>
      </template>
      <template #cell-status="{ row }"><Badge :type="row.status" /></template>
      <template #cell-total="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.total) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <RowActions show-view view-label="View" @view="detail = row" />
      </template>
    </DataTable>

    <!-- Purchase detail -->
    <Modal :open="!!detail" :title="detail ? `Purchase ${detail.id}` : ''" size="max-w-lg" @close="detail = null">
      <div v-if="detail">
        <div class="flex justify-between text-sm mb-4">
          <div>
            <p class="text-xs text-slate-400">Supplier</p>
            <p class="font-semibold text-slate-900 dark:text-white">{{ detail.supplier }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Date</p>
            <p class="font-semibold text-slate-900 dark:text-white">{{ detail.date }}</p>
          </div>
        </div>

        <ul class="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="(item, index) in detail.items" :key="index" class="flex justify-between px-4 py-2.5 text-sm">
            <span class="text-slate-600 dark:text-slate-300">{{ item.qty }} × {{ item.name }}</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ settings.money(item.qty * item.cost) }}</span>
          </li>
        </ul>

        <div class="flex justify-between mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
          <span class="font-semibold text-slate-900 dark:text-white">Total</span>
          <span class="font-bold text-brand-600 text-lg">{{ settings.money(detail.total) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button
            v-if="detail?.status === 'Pending'"
            variant="success"
            block
            icon="check"
            @click="suppliers.updatePurchaseStatus(detail.id, 'Received'); ui.notify('Purchase marked as received'); detail = null"
          >
            Mark received
          </Button>
          <Button block @click="detail = null">Close</Button>
        </div>
      </template>
    </Modal>

    <!-- New purchase -->
    <Modal :open="open" title="New purchase order" size="max-w-2xl" @close="open = false">
      <div class="space-y-4">
        <Select v-model="draft.supplierId" label="Supplier" :options="supplierOptions" />

        <div class="grid sm:grid-cols-[1fr_90px_120px_auto] gap-2 items-end">
          <Select v-model="draft.productId" label="Product" :options="productOptions" />
          <Input v-model.number="draft.qty" label="Qty" type="number" min="1" />
          <Input v-model.number="draft.cost" label="Unit cost" type="number" step="0.01" min="0" />
          <Button variant="secondary" icon="plus" @click="addLine">Add</Button>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="table-head">
              <tr>
                <th class="text-left px-4 py-2.5 font-semibold">Product</th>
                <th class="text-right px-4 py-2.5 font-semibold">Qty</th>
                <th class="text-right px-4 py-2.5 font-semibold">Cost</th>
                <th class="text-right px-4 py-2.5 font-semibold">Subtotal</th>
                <th class="w-10" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="(item, index) in draft.items" :key="index">
                <td class="px-4 py-2.5 text-slate-700 dark:text-slate-200">{{ item.name }}</td>
                <td class="px-4 py-2.5 text-right">{{ item.qty }}</td>
                <td class="px-4 py-2.5 text-right">{{ settings.money(item.cost) }}</td>
                <td class="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  {{ settings.money(item.qty * item.cost) }}
                </td>
                <td class="px-2">
                  <button class="icon-btn-danger" @click="removeLine(index)">
                    <Icon name="x" size="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!draft.items.length">
                <td colspan="5" class="px-4 py-10 text-center text-slate-400">No products added yet.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
          <span class="font-semibold text-slate-900 dark:text-white">Purchase total</span>
          <span class="text-xl font-bold text-brand-600">{{ settings.money(draftTotal) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="open = false">Cancel</Button>
          <Button block icon="check" :disabled="!draft.items.length" @click="confirmPurchase">
            Confirm purchase
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
