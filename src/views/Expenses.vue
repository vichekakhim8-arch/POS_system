<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import DateRangeDropdown from '@/components/ui/DateRangeDropdown.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import RowActions from '@/components/ui/RowActions.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { useExpensesStore } from '@/stores/expenses'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { CHART_COLORS, round2, today } from '@/utils/helpers'
import { resolveRange } from '@/utils/dateRanges'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const expenses = useExpensesStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()

const open = ref(false)
const deleting = ref(null)
const rangeKey = ref('last30')
const range = ref(resolveRange('last30'))
const form = reactive({ name: '', category: 'Rent', amount: '', date: today(), note: '' })

const { loading, error, reload } = useAsyncView('expenses')
const { run } = useAction()

const rows = computed(() =>
  expenses.filtered.filter((e) => e.date >= range.value.from && e.date <= range.value.to)
)
const total = computed(() => round2(rows.value.reduce((s, e) => s + e.amount, 0)))

const mix = computed(() =>
  expenses.categories
    .map((category, i) => ({
      label: category,
      color: CHART_COLORS[i % CHART_COLORS.length],
      value: round2(rows.value.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0))
    }))
    .filter((d) => d.value > 0)
)

const columns = computed(() => [
  { key: 'name', label: 'Expense', sortable: true },
  { key: 'category', label: t('common.category'), sortable: true },
  { key: 'date', label: t('common.date'), sortable: true },
  { key: 'amount', label: t('common.amount'), align: 'right', sortable: true },
  { key: 'actions', label: '', align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'id', label: 'Reference' },
  { key: 'name', label: 'Expense' },
  { key: 'category', label: 'Category' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
  { key: 'amount', label: 'Amount', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const save = async () => {
  if (!form.name.trim()) return ui.notify('Expense name is required', 'error')
  if (!(Number(form.amount) > 0)) return ui.notify('Enter a valid amount', 'error')
  await run(() => expenses.add({ ...form, amount: Number(form.amount) }), { message: t('common.saving') })
  ui.notify(t('common.save'))
  Object.assign(form, { name: '', category: 'Rent', amount: '', date: today(), note: '' })
  open.value = false
}

const confirmBulkDelete = async (ids) => {
  await run(() => ids.forEach((id) => expenses.remove(id)), { message: t('common.deleting') })
  ui.notify(t('common.deletedCount', { count: ids.length }))
}

const confirmDelete = async () => {
  const expense = deleting.value
  await run(() => expenses.remove(expense.id), { message: t('common.deleting') })
  deleting.value = null
}
</script>

<template>
  <div>
    <PageHeader icon="wallet" :title="t('nav.expenses')" subtitle="Track and categorise business costs">
      <template #actions>
        <DateRangeDropdown
          v-model="rangeKey"
          :from="range.from"
          :to="range.to"
          @change="range = { from: $event.from, to: $event.to }"
        />
        <ExportMenu
          filename="expenses"
          :title="t('nav.expenses')"
          :subtitle="`${range.from} → ${range.to}`"
          :columns="exportColumns"
          :rows="rows"
          :summary="[[t('common.total'), settings.money(total)]]"
        />
        <Button icon="plus" @click="open = true">{{ t('common.add') }}</Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 stagger">
      <StatCard
        :label="t('common.total')"
        :amount="total"
        :decimals="2"
        :prefix="settings.currency"
        icon="wallet"
        tone="rose"
      />
      <StatCard label="Records" :amount="rows.length" icon="clipboard" />
      <StatCard
        label="Average"
        :amount="rows.length ? total / rows.length : 0"
        :decimals="2"
        :prefix="settings.currency"
        icon="chart"
        tone="amber"
      />
      <StatCard
        label="Largest"
        :amount="Math.max(0, ...rows.map((e) => e.amount))"
        :decimals="2"
        :prefix="settings.currency"
        icon="trendUp"
        tone="violet"
      />
    </div>

    <div class="grid xl:grid-cols-3 gap-5 items-start">
      <div class="xl:col-span-2 min-w-0">
        <DataTable
          :columns="columns"
          :rows="rows"
          selectable
          confirm-delete
          paginate
          :loading="loading"
          :error="error"
          :per-page="10"
          item-label="expenses"
          @retry="reload"
          min-width="min-w-[640px]"
          max-height="max-h-[560px]"
          empty-icon="wallet"
          @delete-selected="confirmBulkDelete"
        >
          <template #toolbar>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {{ t('common.category') }}
              </span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="option in ['All', ...expenses.categories]"
                  :key="option"
                  type="button"
                  class="h-8 px-3 rounded-lg text-[12px] font-semibold transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  :class="
                    expenses.category === option
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
                  "
                  :style="
                    expenses.category === option
                      ? { background: 'var(--c-primary)' }
                      : { background: 'var(--c-subtle)' }
                  "
                  @click="expenses.setCategory(option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </template>

          <template #cell-name="{ row }">
            <p class="font-medium text-slate-900 dark:text-white">{{ row.name }}</p>
            <p class="text-xs text-slate-400">{{ row.note }}</p>
          </template>
          <template #cell-amount="{ row }">
            <span class="font-semibold text-rose-600">{{ settings.money(row.amount) }}</span>
          </template>
          <template #cell-actions="{ row }">
            <RowActions
              show-delete
              :delete-label="t('common.delete')"
              @delete="deleting = row"
            />
          </template>

          <template #footer>
            <div class="flex justify-between text-sm">
              <span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('common.total') }}</span>
              <span class="font-bold text-rose-600">{{ settings.money(total) }}</span>
            </div>
          </template>
        </DataTable>
      </div>

      <section class="card p-5 flex flex-col">
        <header class="mb-4">
          <h3 class="font-semibold text-slate-900 dark:text-white">Expense breakdown</h3>
          <p class="text-xs text-slate-400 mt-0.5">{{ range.from }} → {{ range.to }}</p>
        </header>
        <div class="grow grid place-items-center">
          <DonutChart :data="mix" :size="176" :formatter="(v) => settings.money(v)" />
        </div>
      </section>
    </div>

    <Modal :open="open" :title="t('common.add')" size="max-w-md" @close="open = false">
      <div class="space-y-4">
        <Input v-model="form.name" label="Expense name" icon="wallet" placeholder="Monthly store rent" />
        <div class="grid sm:grid-cols-2 gap-4">
          <Select v-model="form.category" :label="t('common.category')" :options="expenses.categories" />
          <Input
            v-model="form.amount"
            :label="t('common.amount')"
            type="number"
            step="0.01"
            min="0"
            :suffix-text="settings.currency"
          />
        </div>
        <Input v-model="form.date" :label="t('common.date')" type="date" />
        <Input v-model="form.note" :label="t('common.note')" :rows="2" />
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
      :title="t('expenses.deleteTitle')"
      :message="`“${deleting?.name}” ${t('expenses.deleteHint')}`"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
