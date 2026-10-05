<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { exportPdf, exportExcel } from '@/utils/export'
import { round2 } from '@/utils/helpers'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const router = useRouter()
const suppliers = useSuppliersStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()

const open = ref(false)
const editing = ref(null)
const detail = ref(null)
const deleting = ref(null)
const form = reactive({ name: '', contact: '', phone: '', email: '', address: '', supplies: '' })

const { loading, error, reload } = useAsyncView('suppliers')
const { run } = useAction()

const rows = computed(() =>
  suppliers.items.map((s) => ({
    ...s,
    purchases: suppliers.purchasesBySupplier(s.id).length,
    spend: round2(suppliers.purchasesBySupplier(s.id).reduce((a, p) => a + p.total, 0))
  }))
)

const columns = computed(() => [
  { key: 'name', label: t('common.supplier'), sortable: true },
  { key: 'contact', label: 'Contact person' },
  { key: 'phone', label: t('common.phone') },
  { key: 'supplies', label: 'Supplies' },
  { key: 'purchases', label: 'Orders', align: 'right', sortable: true },
  { key: 'spend', label: 'Total spend', align: 'right', sortable: true },
  { key: 'actions', label: t('common.actions'), align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'name', label: 'Supplier' },
  { key: 'contact', label: 'Contact person' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'supplies', label: 'Supplies' },
  { key: 'purchases', label: 'Purchase orders', align: 'right' },
  { key: 'spend', label: 'Total spend', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const purchaseColumns = [
  { key: 'id', label: 'PO number' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', contact: '', phone: '', email: '', address: '', supplies: '' })
  open.value = true
}

const openEdit = (supplier) => {
  editing.value = supplier
  Object.assign(form, { ...supplier })
  open.value = true
}

const save = async () => {
  if (!form.name.trim()) return ui.notify('Supplier name is required', 'error')
  await run(() => {
    if (editing.value) suppliers.update(editing.value.id, { ...form })
    else suppliers.add({ ...form })
  }, { message: t('common.saving') })
  ui.notify(t('common.save'))
  open.value = false
}

const confirmBulkDelete = async (ids) => {
  await run(() => ids.forEach((id) => suppliers.remove(id)), { message: t('common.deleting') })
  ui.notify(t('common.deletedCount', { count: ids.length }))
}

const confirmDelete = async () => {
  const supplier = deleting.value
  await run(() => suppliers.remove(supplier.id), { message: t('common.deleting') })
  if (detail.value?.id === supplier.id) detail.value = null
  deleting.value = null
}

const history = computed(() => (detail.value ? suppliers.purchasesBySupplier(detail.value.id) : []))

const exportHistory = (type) => {
  const payload = {
    filename: `supplier-${detail.value.id}-purchases`,
    title: `Purchase history — ${detail.value.name}`,
    columns: purchaseColumns,
    rows: history.value
  }
  if (type === 'pdf')
    exportPdf({
      ...payload,
      subtitle: `${history.value.length} purchase orders`,
      meta: [detail.value.phone, detail.value.email, detail.value.address],
      summary: [['Total spend', settings.money(detail.value.spend)]]
    })
  else exportExcel({ ...payload, sheetName: 'Purchases' })
  ui.notify('Purchase history exported')
}
</script>

<template>
  <div>
    <PageHeader icon="truck" :title="t('nav.suppliers')" :subtitle="`${suppliers.items.length} suppliers`">
      <template #actions>
        <ExportMenu
          filename="suppliers"
          :title="t('nav.suppliers')"
          :columns="exportColumns"
          :rows="rows"
          :formats="['excel', 'csv']"
        />
        <Button variant="secondary" icon="cart" @click="router.push('/purchases')">
          {{ t('nav.purchases') }}
        </Button>
        <Button icon="plus" @click="openCreate">{{ t('common.add') }}</Button>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="rows"
      selectable
      clickable
      paginate
      confirm-delete
      :loading="loading"
      :error="error"
      :per-page="10"
      item-label="suppliers"
      @retry="reload"
      min-width="min-w-[920px]"
      empty-icon="truck"
      @row-click="detail = $event"
      @delete-selected="confirmBulkDelete"
    >
      <template #cell-name="{ row }">
        <p class="font-medium text-slate-900 dark:text-white">{{ row.name }}</p>
        <p class="text-xs text-slate-400">{{ row.email }}</p>
      </template>
      <template #cell-spend="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.spend) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <RowActions
          show-view
          show-edit
          show-delete
          :view-label="t('common.view')"
          :edit-label="t('common.edit')"
          :delete-label="t('common.delete')"
          @view="detail = row"
          @edit="openEdit(row)"
          @delete="deleting = row"
        />
      </template>
    </DataTable>

    <Modal :open="!!detail" :title="detail?.name || ''" size="max-w-xl" @close="detail = null">
      <div v-if="detail" class="space-y-5 text-sm">
        <dl class="grid sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
          <div><dt class="text-xs text-slate-400">Contact</dt><dd>{{ detail.contact }}</dd></div>
          <div><dt class="text-xs text-slate-400">{{ t('common.phone') }}</dt><dd>{{ detail.phone }}</dd></div>
          <div><dt class="text-xs text-slate-400">{{ t('common.email') }}</dt><dd>{{ detail.email }}</dd></div>
          <div><dt class="text-xs text-slate-400">{{ t('common.address') }}</dt><dd>{{ detail.address }}</dd></div>
          <div class="sm:col-span-2"><dt class="text-xs text-slate-400">Supplies</dt><dd>{{ detail.supplies }}</dd></div>
        </dl>

        <div class="flex gap-2">
          <Button variant="secondary" size="sm" icon="print" @click="exportHistory('pdf')">{{ t('exports.pdf') }}</Button>
          <Button variant="secondary" size="sm" icon="chart" @click="exportHistory('excel')">{{ t('exports.excel') }}</Button>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table class="w-full">
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="purchase in history" :key="purchase.id">
                <td class="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{{ purchase.id }}</td>
                <td class="px-4 py-2.5 text-slate-500">{{ purchase.date }}</td>
                <td class="px-4 py-2.5"><Badge :type="purchase.status" /></td>
                <td class="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  {{ settings.money(purchase.total) }}
                </td>
              </tr>
              <tr v-if="!history.length">
                <td colspan="4" class="px-4 py-8 text-center text-slate-400">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="danger" block icon="trash" @click="suppliers.remove(detail.id); detail = null">
            {{ t('common.delete') }}
          </Button>
          <Button block @click="detail = null">{{ t('common.close') }}</Button>
        </div>
      </template>
    </Modal>

    <Modal :open="open" :title="editing ? t('common.edit') : t('common.add')" size="max-w-md" @close="open = false">
      <div class="space-y-4">
        <Input v-model="form.name" :label="t('common.supplier')" icon="truck" />
        <Input v-model="form.contact" label="Contact person" icon="user" />
        <div class="grid sm:grid-cols-2 gap-4">
          <Input v-model="form.phone" :label="t('common.phone')" />
          <Input v-model="form.email" :label="t('common.email')" type="email" />
        </div>
        <Input v-model="form.address" :label="t('common.address')" />
        <Input v-model="form.supplies" label="Products supplied" placeholder="Beverages, Snacks" />
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
      :title="t('suppliers.deleteTitle')"
      :message="`${deleting?.name} ${t('suppliers.deleteHint')}`"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
