<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import FilterPanel from '@/components/ui/FilterPanel.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import DateRangeDropdown from '@/components/ui/DateRangeDropdown.vue'
import RowActions from '@/components/ui/RowActions.vue'
import OrderSummary from '@/components/pos/OrderSummary.vue'
import { useOrdersStore } from '@/stores/orders'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { exportPdf } from '@/utils/export'
import { resolveRange } from '@/utils/dateRanges'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'
import { round2 } from '@/utils/helpers'

const orders = useOrdersStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()

const search = ref('')
const status = ref('All')
const method = ref('All')
const detail = ref(null)
const deleting = ref(null)
const rangeKey = ref('last30')
const range = ref(resolveRange('last30'))
const filtersOpen = ref(false)

const activeFilterCount = computed(() => [status.value, method.value].filter((v) => v !== 'All').length)

/** Centered loading on first paint; `reload` powers the table's retry button. */
const { loading, error, reload } = useAsyncView('orders')
const { run } = useAction()

const statuses = ['Paid', 'Pending', 'Cancelled', 'Refunded']

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return orders.items
    .filter((o) => o.date >= range.value.from && o.date <= range.value.to)
    .filter((o) => status.value === 'All' || o.status === status.value)
    .filter((o) => method.value === 'All' || o.method === method.value)
    .filter((o) => !term || o.id.toLowerCase().includes(term) || o.customer.toLowerCase().includes(term))
    .map((o) => ({ ...o, count: o.items.length }))
})

const filteredTotal = computed(() => round2(filtered.value.reduce((s, o) => s + o.total, 0)))

/** Widths set an intentional rhythm instead of letting content dictate it. */
const columns = computed(() => [
  { key: 'id', label: 'Order', sortable: true, width: 'w-[128px]' },
  { key: 'customer', label: t('common.customer'), sortable: true, width: 'w-[200px]' },
  { key: 'date', label: t('common.date'), sortable: true, width: 'w-[170px]' },
  { key: 'count', label: 'Items', align: 'right', width: 'w-[72px]' },
  { key: 'method', label: t('pos.paymentMethod'), width: 'w-[140px]' },
  { key: 'status', label: t('common.status'), sortable: true, width: 'w-[120px]' },
  { key: 'total', label: t('common.total'), align: 'right', sortable: true, width: 'w-[120px]' },
  { key: 'actions', label: '', align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'id', label: 'Order ID' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'customer', label: 'Customer' },
  { key: 'cashier', label: 'Cashier' },
  { key: 'count', label: 'Items', align: 'right' },
  { key: 'method', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'subtotal', label: 'Subtotal', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'discount', label: 'Discount', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'tax', label: 'Tax', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'total', label: 'Total', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const setStatus = (newStatus) => {
  orders.updateStatus(detail.value.id, newStatus)
  ui.notify(`${detail.value.id} → ${newStatus}`)
  detail.value = null
}

/** Single-order invoice PDF */
const exportInvoice = () => {
  const order = detail.value
  exportPdf({
    filename: `invoice-${order.id}`,
    title: `Invoice ${order.id}`,
    subtitle: `${order.customer} · ${order.date} ${order.time}`,
    meta: [
      `${settings.store} · ${settings.phone}`,
      settings.address,
      `Cashier: ${order.cashier} · Payment: ${order.method} · Status: ${order.status}`
    ],
    columns: [
      { key: 'name', label: 'Item' },
      { key: 'qty', label: 'Qty', align: 'right' },
      { key: 'price', label: 'Unit price', align: 'right', format: (v) => settings.money(v) },
      {
        key: 'line',
        label: 'Amount',
        align: 'right',
        format: (_, row) => settings.money((row.price - (row.discount || 0)) * row.qty)
      }
    ],
    rows: order.items,
    summary: [
      [t('common.subtotal'), settings.money(order.subtotal)],
      [t('common.discount'), `-${settings.money(order.discount)}`],
      [`${t('common.tax')} (${settings.taxRate}%)`, settings.money(order.tax)],
      [t('common.total'), settings.money(order.total)],
      [t('pos.paid'), settings.money(order.paid)],
      [t('pos.change'), settings.money(order.change)]
    ]
  })
  ui.notify(`Invoice ${order.id} exported`)
}

const confirmBulkDelete = async (ids) => {
  await run(() => ids.forEach((id) => orders.removeOrder(id)), { message: t('common.deleting') })
  ui.notify(t('common.deletedCount', { count: ids.length }))
}

const confirmDelete = async () => {
  const order = deleting.value
  await run(() => orders.removeOrder(order.id), { message: t('common.deleting') })
  if (detail.value?.id === order.id) detail.value = null
  deleting.value = null
}
</script>

<template>
  <div>
    <PageHeader icon="clipboard" :title="t('nav.orders')" :subtitle="`${filtered.length} orders`">
      <template #actions>
        <DateRangeDropdown
          v-model="rangeKey"
          :from="range.from"
          :to="range.to"
          @change="range = { from: $event.from, to: $event.to }"
        />
        <ExportMenu
          filename="orders"
          :title="t('nav.orders')"
          :subtitle="`${range.from} → ${range.to}`"
          :columns="exportColumns"
          :rows="filtered"
          :summary="[[t('common.total'), settings.money(filteredTotal)]]"
          orientation="landscape"
        />
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 stagger">
      <StatCard :label="t('nav.orders')" :amount="orders.items.length" icon="clipboard" :loading="loading" />
      <StatCard label="Paid" :amount="orders.paid.length" icon="check" tone="emerald" :loading="loading" />
      <StatCard
        :label="t('dashboard.revenue')"
        :amount="filteredTotal"
        :decimals="2"
        :prefix="settings.currency"
        icon="dollar"
        tone="sky"
        :loading="loading"
      />
      <StatCard
        :label="t('date.today')"
        :amount="orders.todayOrders.length"
        icon="calendar"
        tone="violet"
        :loading="loading"
      />
    </div>

    <DataTable
      :columns="columns"
      :rows="filtered"
      clickable
      selectable
      confirm-delete
      paginate
      :loading="loading"
      :error="error"
      :per-page="10"
      item-label="orders"
      min-width="min-w-[860px]"
      empty-icon="clipboard"
      empty-text="No orders match your filters."
      @row-click="detail = $event"
      @delete-selected="confirmBulkDelete"
      @retry="reload"
    >
      <template #toolbar>
        <FilterPanel
          v-model:open="filtersOpen"
          :active-count="activeFilterCount"
          @reset="status = 'All'; method = 'All'; search = ''"
        >
          <template #search>
            <Input v-model="search" icon="search" placeholder="Order ID or customer…" />
          </template>
          <Select v-model="status" label="Status" :options="['All', ...statuses]" />
          <Select
            v-model="method"
            label="Payment method"
            :options="['All', 'Cash', 'KHQR', 'Card', 'Bank Transfer']"
          />
        </FilterPanel>
      </template>

      <!-- primary identifier -->
      <template #cell-id="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white tabular-nums">{{ row.id }}</span>
      </template>

      <template #cell-customer="{ row }">
        <span class="text-slate-700 dark:text-slate-200 truncate block max-w-[180px]">
          {{ row.customer }}
        </span>
      </template>

      <!-- secondary: quieter, time de-emphasised -->
      <template #cell-date="{ row }">
        <span class="text-slate-500 whitespace-nowrap">
          {{ row.date }}
          <span class="text-slate-400 ml-1">{{ row.time }}</span>
        </span>
      </template>

      <template #cell-count="{ row }">
        <span class="text-slate-500 tabular-nums">{{ row.count }}</span>
      </template>

      <template #cell-method="{ row }">
        <span class="text-slate-500">{{ row.method }}</span>
      </template>

      <template #cell-status="{ row }"><Badge :type="row.status" size="sm" dot /></template>

      <!-- primary metric -->
      <template #cell-total="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white tabular-nums">
          {{ settings.money(row.total) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <RowActions
          show-view
          show-delete
          :view-label="t('common.view')"
          :delete-label="t('common.delete')"
          @view="detail = row"
          @delete="deleting = row"
        />
      </template>

      <template #card="{ row }">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 dark:text-white tabular-nums">{{ row.id }}</p>
            <p class="t-caption text-slate-400 mt-0.5">{{ row.date }} · {{ row.time }}</p>
          </div>
          <Badge :type="row.status" size="sm" dot />
        </div>

        <p class="mt-3 text-[13.5px] text-slate-700 dark:text-slate-200 truncate">{{ row.customer }}</p>
        <p class="t-caption text-slate-400 mt-0.5">{{ row.count }} items · {{ row.method }}</p>

        <div
          class="mt-auto pt-3 flex items-baseline justify-between border-t"
          :style="{ borderColor: 'var(--c-border)' }"
        >
          <span class="t-caption text-slate-400">{{ t('common.total') }}</span>
          <span class="text-[17px] font-bold text-slate-900 dark:text-white tabular-nums">
            {{ settings.money(row.total) }}
          </span>
        </div>
      </template>
    </DataTable>

    <!-- order detail -->
    <Modal :open="!!detail" :title="detail ? `Order ${detail.id}` : ''" size="max-w-lg" @close="detail = null">
      <div v-if="detail">
        <div
          class="flex items-center justify-between gap-3 p-3 rounded-xl mb-4"
          :style="{ background: 'var(--c-subtle)' }"
        >
          <div class="min-w-0">
            <p class="t-caption text-slate-400">{{ t('common.status') }}</p>
            <Badge :type="detail.status" size="sm" dot class="mt-1" />
          </div>
          <div class="text-right">
            <p class="t-caption text-slate-400">{{ t('common.total') }}</p>
            <p class="text-[19px] font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
              {{ settings.money(detail.total) }}
            </p>
          </div>
        </div>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px] mb-4">
          <div>
            <dt class="t-caption text-slate-400">{{ t('common.customer') }}</dt>
            <dd class="font-medium text-slate-800 dark:text-slate-100 truncate">{{ detail.customer }}</dd>
          </div>
          <div>
            <dt class="t-caption text-slate-400">Cashier</dt>
            <dd class="font-medium text-slate-800 dark:text-slate-100 truncate">{{ detail.cashier }}</dd>
          </div>
          <div>
            <dt class="t-caption text-slate-400">{{ t('common.date') }}</dt>
            <dd class="font-medium text-slate-800 dark:text-slate-100">{{ detail.date }} {{ detail.time }}</dd>
          </div>
          <div>
            <dt class="t-caption text-slate-400">{{ t('pos.paymentMethod') }}</dt>
            <dd class="font-medium text-slate-800 dark:text-slate-100">{{ detail.method }}</dd>
          </div>
        </dl>

        <ul class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
          <li v-for="item in detail.items" :key="item.id" class="flex items-center gap-3 px-4 py-2.5">
            <img :src="item.image" :alt="item.name" class="w-9 h-9 rounded-lg object-cover" />
            <div class="grow min-w-0">
              <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ item.name }}</p>
              <p class="text-xs text-slate-400">{{ item.qty }} × {{ settings.money(item.price) }}</p>
            </div>
            <span class="text-sm font-semibold text-slate-900 dark:text-white">
              {{ settings.money(item.price * item.qty) }}
            </span>
          </li>
        </ul>

        <div class="mt-4">
          <OrderSummary compact :subtotal="detail.subtotal" :discount="detail.discount" :tax="detail.tax" :total="detail.total" />
        </div>

        <Button variant="secondary" block icon="print" class="mt-4" @click="exportInvoice">
          {{ t('exports.pdf') }}
        </Button>
      </div>

      <template #footer>
        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">{{ t('common.status') }}</p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="s in statuses"
              :key="s"
              size="sm"
              class="grow"
              :variant="detail?.status === s ? 'primary' : 'secondary'"
              @click="setStatus(s)"
            >
              {{ s }}
            </Button>
          </div>
        </div>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      :title="t('orders.deleteTitle')"
      :message="`${deleting?.id} ${t('orders.deleteHint')}`"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
