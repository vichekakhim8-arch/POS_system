<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useCustomersStore } from '@/stores/customers'
import { useOrdersStore } from '@/stores/orders'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { exportPdf, exportExcel } from '@/utils/export'
import { initials, round2 } from '@/utils/helpers'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const customers = useCustomersStore()
const orders = useOrdersStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()

const open = ref(false)
const editing = ref(null)
const detail = ref(null)
const deleting = ref(null)
const form = reactive({ name: '', phone: '', email: '', address: '' })

const { loading, error, reload } = useAsyncView('customers')
const { run } = useAction()

const enriched = computed(() =>
  customers.filtered.map((customer) => {
    const history = orders.paid.filter((o) => o.customerId === customer.id)
    return {
      ...customer,
      orders: history.length,
      spent: round2(history.reduce((s, o) => s + o.total, 0)),
      last: history[0]?.date || '—',
      history
    }
  })
)

const columns = computed(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'phone', label: t('common.phone') },
  { key: 'email', label: t('common.email') },
  { key: 'orders', label: t('nav.orders'), align: 'right', sortable: true },
  { key: 'spent', label: 'Total spent', align: 'right', sortable: true },
  { key: 'last', label: 'Last order' },
  { key: 'actions', label: t('common.actions'), align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'name', label: 'Customer' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'joined', label: 'Customer since' },
  { key: 'orders', label: 'Orders', align: 'right' },
  { key: 'spent', label: 'Total spent', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'last', label: 'Last order' }
]

const historyColumns = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'method', label: 'Payment' },
  { key: 'total', label: 'Total', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', phone: '', email: '', address: '' })
  open.value = true
}

const openEdit = (customer) => {
  editing.value = customer
  Object.assign(form, {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address
  })
  open.value = true
}

const save = async () => {
  if (!form.name.trim()) return ui.notify('Customer name is required', 'error')
  await run(() => {
    if (editing.value) customers.update(editing.value.id, { ...form })
    else customers.add({ ...form })
  }, { message: t('common.saving') })
  ui.notify(t('common.save'))
  open.value = false
}

const confirmBulkDelete = async (ids) => {
  await run(() => ids.forEach((id) => customers.remove(id)), { message: t('common.deleting') })
  ui.notify(t('common.deletedCount', { count: ids.length }))
}

const confirmDelete = async () => {
  const customer = deleting.value
  await run(() => customers.remove(customer.id), { message: t('common.deleting') })
  if (detail.value?.id === customer.id) detail.value = null
  deleting.value = null
}

const exportHistoryPdf = () => {
  exportPdf({
    filename: `customer-${detail.value.name.replace(/\s+/g, '-').toLowerCase()}`,
    title: `Purchase history — ${detail.value.name}`,
    subtitle: `${detail.value.orders} orders · ${settings.money(detail.value.spent)} lifetime value`,
    meta: [`Phone: ${detail.value.phone}`, `Email: ${detail.value.email}`, detail.value.address],
    columns: historyColumns,
    rows: detail.value.history,
    summary: [['Total spent', settings.money(detail.value.spent)]]
  })
  ui.notify('Purchase history exported')
}

const exportHistoryExcel = () => {
  exportExcel({
    filename: `customer-${detail.value.id}-history`,
    sheetName: 'History',
    title: `Purchase history — ${detail.value.name}`,
    columns: historyColumns,
    rows: detail.value.history
  })
  ui.notify('Purchase history exported')
}
</script>

<template>
  <div>
    <PageHeader icon="users" :title="t('nav.customers')" :subtitle="`${customers.items.length} customers`">
      <template #actions>
        <ExportMenu
          filename="customers"
          :title="t('nav.customers')"
          :columns="exportColumns"
          :rows="enriched"
          :formats="['excel', 'csv']"
        />
        <Button icon="plus" @click="openCreate">{{ t('common.add') }}</Button>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="enriched"
      selectable
      clickable
      confirm-delete
      paginate
      :loading="loading"
      :error="error"
      :per-page="12"
      item-label="customers"
      @retry="reload"
      default-view="cards"
      min-width="min-w-[880px]"
      empty-icon="users"
      card-columns="sm:grid-cols-2 xl:grid-cols-3"
      @row-click="detail = $event"
      @delete-selected="confirmBulkDelete"
    >
      <template #toolbar>
        <Input
          :model-value="customers.search"
          icon="search"
          :placeholder="t('common.searchPlaceholder')"
          class="sm:max-w-sm"
          @update:model-value="customers.setSearch($event)"
        />
      </template>

      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <span
            class="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0"
          >
            {{ initials(row.name) }}
          </span>
          <span class="font-medium text-slate-900 dark:text-white truncate">{{ row.name }}</span>
        </div>
      </template>
      <template #cell-spent="{ row }">
        <span class="font-semibold text-emerald-600">{{ settings.money(row.spent) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <RowActions
          show-view
          show-edit
          :view-label="t('common.view')"
          :edit-label="t('common.edit')"
          @view="detail = row"
          @edit="openEdit(row)"
        />
      </template>

      <template #card="{ row }">
        <div class="flex items-start gap-3">
          <span
            class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold shrink-0"
          >
            {{ initials(row.name) }}
          </span>
          <div class="min-w-0 grow">
            <p class="font-semibold text-slate-900 dark:text-white truncate">{{ row.name }}</p>
            <p class="text-xs text-slate-400 truncate">{{ row.email }}</p>
            <p class="text-xs text-slate-400">{{ row.phone }}</p>
          </div>
          <button class="icon-btn" @click.stop="openEdit(row)"><Icon name="edit" size="w-4 h-4" /></button>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ row.orders }}</p>
            <p class="text-[10px] text-slate-400">{{ t('nav.orders') }}</p>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <p class="text-sm font-bold text-emerald-600">{{ settings.money(row.spent) }}</p>
            <p class="text-[10px] text-slate-400">Spent</p>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ row.last }}</p>
            <p class="text-[10px] text-slate-400">Last</p>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- detail -->
    <Modal :open="!!detail" :title="detail?.name || ''" size="max-w-2xl" @close="detail = null">
      <div v-if="detail">
        <div class="grid sm:grid-cols-4 gap-3 mb-5">
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            <p class="text-xs text-slate-400">{{ t('nav.orders') }}</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">{{ detail.orders }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            <p class="text-xs text-slate-400">Total spent</p>
            <p class="text-lg font-bold text-emerald-600">{{ settings.money(detail.spent) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            <p class="text-xs text-slate-400">Average</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">
              {{ settings.money(detail.orders ? detail.spent / detail.orders : 0) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            <p class="text-xs text-slate-400">Last order</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">{{ detail.last }}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <Button variant="secondary" size="sm" icon="print" @click="exportHistoryPdf">{{ t('exports.pdf') }}</Button>
          <Button variant="secondary" size="sm" icon="chart" @click="exportHistoryExcel">{{ t('exports.excel') }}</Button>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
          <table class="w-full text-sm">
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="order in detail.history" :key="order.id">
                <td class="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{{ order.id }}</td>
                <td class="px-4 py-2.5 text-slate-500">{{ order.date }}</td>
                <td class="px-4 py-2.5 text-slate-500">{{ order.items.length }} items</td>
                <td class="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  {{ settings.money(order.total) }}
                </td>
              </tr>
              <tr v-if="!detail.history.length">
                <td colspan="4" class="px-4 py-8 text-center text-slate-400">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="danger" block icon="trash" @click="deleting = detail">
            {{ t('common.delete') }}
          </Button>
          <Button block @click="detail = null">{{ t('common.close') }}</Button>
        </div>
      </template>
    </Modal>

    <Modal :open="open" :title="editing ? t('common.edit') : t('common.add')" size="max-w-md" @close="open = false">
      <div class="space-y-4">
        <Input v-model="form.name" :label="t('common.name')" icon="user" />
        <Input v-model="form.phone" :label="t('common.phone')" icon="bell" />
        <Input v-model="form.email" :label="t('common.email')" type="email" />
        <Input v-model="form.address" :label="t('common.address')" :rows="2" />
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="open = false">{{ t('common.cancel') }}</Button>
          <Button block icon="check" @click="save">{{ t('common.save') }}</Button>
        </div>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      :title="t('customers.deleteTitle')"
      :message="`${deleting?.name} ${t('customers.deleteHint')}`"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
