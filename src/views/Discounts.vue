<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DropdownItem from '@/components/ui/DropdownItem.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import FilterPanel from '@/components/ui/FilterPanel.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import RowActions from '@/components/ui/RowActions.vue'
import DiscountSummary from '@/components/discounts/DiscountSummary.vue'
import { useDiscountsStore } from '@/stores/discounts'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { APPLY_TO_OPTIONS, STATUS_OPTIONS } from '@/data/discounts'
import { shortDate } from '@/utils/helpers'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const router = useRouter()
const discounts = useDiscountsStore()
const products = useProductsStore()
const settings = useSettingsStore()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

const viewing = ref(null)
const deleting = ref(null)
const filtersOpen = ref(false)

const { loading, error, reload } = useAsyncView('discounts')
const { run } = useAction()

const rows = computed(() => discounts.filtered)

const columns = computed(() => [
  { key: 'name', label: 'Discount', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'value', label: 'Value', align: 'right', sortable: true },
  { key: 'applyTo', label: 'Applies to' },
  { key: 'startDate', label: 'Start date', sortable: true },
  { key: 'endDate', label: 'End date', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right', cardHide: true, sticky: true }
])

const exportColumns = [
  { key: 'id', label: 'Reference' },
  { key: 'name', label: 'Discount' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'applyTo', label: 'Applies to' },
  { key: 'code', label: 'Code' },
  { key: 'startDate', label: 'Start date' },
  { key: 'endDate', label: 'End date' },
  { key: 'usageCount', label: 'Times used', align: 'right' },
  { key: 'status', label: 'Status' }
]

const formatValue = (d) =>
  d.type === 'percentage' ? `${d.value}% OFF` : `${settings.money(d.value)} OFF`

const appliesLabel = (d) => {
  if (d.applyTo === 'all') return 'All Products'
  if (d.applyTo === 'categories')
    return d.categoryIds.length
      ? d.categoryIds.map((id) => products.categories.find((c) => c.id === id)?.name).filter(Boolean).join(', ')
      : 'No categories'
  if (d.applyTo === 'products')
    return `${d.productIds.length} product${d.productIds.length === 1 ? '' : 's'}`
  return `${d.variantIds.length} variant${d.variantIds.length === 1 ? '' : 's'}`
}

const dateRange = (d) =>
  d.startDate && d.endDate ? `${shortDate(d.startDate)} → ${shortDate(d.endDate)}` : 'Not scheduled'

const toggle = async (d) => {
  await run(() => discounts.setActive(d.id, !d.active), { message: t('common.saving') })
  ui.notify(`${d.name} ${d.active ? 'deactivated' : 'activated'}`)
}

const duplicate = async (d) => {
  let copy
  await run(() => {
    copy = discounts.duplicate(d.id)
  }, { message: t('common.saving') })
  ui.notify(`${copy.name} created — review and activate`)
  router.push(`/discounts/${copy.id}/edit`)
}

const confirmDelete = async () => {
  const discount = deleting.value
  await run(() => discounts.remove(discount.id), { message: t('common.deleting') })
  ui.notify(t('common.deleted'))
  deleting.value = null
}

const activeFilterCount = computed(
  () =>
    [discounts.statusFilter, discounts.typeFilter, discounts.appliesToFilter, discounts.dateFilter].filter(
      (v) => v !== 'All'
    ).length
)
</script>

<template>
  <div>
    <PageHeader
      icon="sparkles"
      :title="t('nav.discounts')"
      :subtitle="`${rows.length} of ${discounts.stats.total} campaigns`"
    >
      <template #actions>
        <ExportMenu
          filename="discounts"
          title="Discount campaigns"
          :columns="exportColumns"
          :rows="rows"
          :formats="['excel', 'csv', 'pdf']"
          orientation="landscape"
        />
        <Button
          v-if="auth.can('createDiscounts')"
          icon="plus"
          @click="router.push('/discounts/new')"
        >
          Create discount
        </Button>
      </template>
    </PageHeader>

    <!-- summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 stagger">
      <StatCard label="Active discounts" :amount="discounts.stats.active" icon="sparkles" tone="emerald" />
      <StatCard label="Scheduled" :amount="discounts.stats.scheduled" icon="calendar" tone="sky" />
      <StatCard label="Expired" :amount="discounts.stats.expired" icon="alert" tone="amber" />
      <StatCard label="Total discounts" :amount="discounts.stats.total" icon="tag" />
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      clickable
      paginate
      :loading="loading"
      :error="error"
      :per-page="10"
      item-label="discounts"
      @retry="reload"
      min-width="min-w-[1020px]"
      empty-icon="sparkles"
      empty-text="No discounts match your filters. Create one to get started."
      card-columns="sm:grid-cols-2 xl:grid-cols-3"
      :allow-fullscreen="true"
      @row-click="viewing = $event"
    >
      <template #toolbar>
        <FilterPanel
          v-model:open="filtersOpen"
          :active-count="activeFilterCount"
          @reset="discounts.resetFilters()"
        >
          <template #search>
            <Input
              :model-value="discounts.search"
              icon="search"
              placeholder="Search name, code, product or category…"
              @update:model-value="discounts.setSearch($event)"
            />
          </template>

          <Select
            :model-value="discounts.statusFilter"
            label="Status"
            :options="STATUS_OPTIONS"
            @update:model-value="discounts.setFilter('statusFilter', $event)"
          />
          <Select
            :model-value="discounts.typeFilter"
            label="Type"
            :options="[
              { value: 'All', label: 'All' },
              { value: 'percentage', label: 'Percentage (%)' },
              { value: 'fixed', label: 'Fixed amount' }
            ]"
            @update:model-value="discounts.setFilter('typeFilter', $event)"
          />
          <Select
            :model-value="discounts.appliesToFilter"
            label="Applies to"
            :options="[{ value: 'All', label: 'All' }, ...APPLY_TO_OPTIONS]"
            @update:model-value="discounts.setFilter('appliesToFilter', $event)"
          />
          <Select
            :model-value="discounts.dateFilter"
            label="Date"
            :options="['All', 'Running', 'Upcoming', 'Past']"
            @update:model-value="discounts.setFilter('dateFilter', $event)"
          />
        </FilterPanel>
      </template>

      <!-- table cells -->
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <span
            class="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0"
          >
            <Icon name="sparkles" size="w-4 h-4" />
          </span>
          <div class="min-w-0">
            <p class="font-medium text-slate-900 dark:text-white truncate">{{ row.name }}</p>
            <p class="text-xs text-slate-400 truncate">
              <span v-if="row.code" class="font-mono">{{ row.code }}</span>
              <span v-else>{{ row.description || 'Automatic' }}</span>
            </p>
          </div>
        </div>
      </template>

      <template #cell-type="{ row }">
        {{ row.type === 'percentage' ? 'Percentage' : 'Fixed amount' }}
      </template>

      <template #cell-value="{ row }">
        <span class="font-bold text-brand-600">{{ formatValue(row) }}</span>
      </template>

      <template #cell-applyTo="{ row }">
        <span class="truncate block max-w-[200px]">{{ appliesLabel(row) }}</span>
      </template>

      <template #cell-startDate="{ row }">
        {{ row.startDate ? shortDate(row.startDate) : '—' }}
      </template>
      <template #cell-endDate="{ row }">
        {{ row.endDate ? shortDate(row.endDate) : '—' }}
      </template>

      <template #cell-status="{ row }"><Badge :type="row.status" dot /></template>

      <template #cell-actions="{ row }">
        <RowActions
          show-view
          :show-edit="auth.can('editDiscounts')"
          :view-label="t('common.view')"
          :edit-label="t('common.edit')"
          @view="viewing = row"
          @edit="router.push(`/discounts/${row.id}/edit`)"
        >
          <Dropdown
            v-if="auth.can('editDiscounts') || auth.can('deleteDiscounts')"
            variant="plain"
            size="sm"
            width="w-48"
          >
            <template #trigger><Icon name="sliders" size="w-4 h-4" /></template>
            <DropdownItem v-if="auth.can('createDiscounts')" icon="layers" @click="duplicate(row)">
              Duplicate
            </DropdownItem>
            <DropdownItem
              v-if="auth.can('toggleDiscounts')"
              :icon="row.active ? 'x' : 'check'"
              @click="toggle(row)"
            >
              {{ row.active ? 'Deactivate' : 'Activate' }}
            </DropdownItem>
            <template v-if="auth.can('deleteDiscounts')">
              <div class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
              <DropdownItem icon="trash" danger @click="deleting = row">Delete</DropdownItem>
            </template>
          </Dropdown>
        </RowActions>
      </template>

      <!-- mobile / card view -->
      <template #card="{ row }">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0"
            >
              <Icon name="sparkles" size="w-4 h-4" />
            </span>
            <div class="min-w-0">
              <p class="font-semibold text-slate-900 dark:text-white truncate">{{ row.name }}</p>
              <p class="text-xs font-bold text-brand-600">{{ formatValue(row) }}</p>
            </div>
          </div>
          <Badge :type="row.status" dot />
        </div>

        <dl class="mt-3 space-y-1.5 text-xs grow">
          <div class="flex justify-between gap-2">
            <dt class="text-slate-400">Applies to</dt>
            <dd class="text-slate-700 dark:text-slate-200 truncate">{{ appliesLabel(row) }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-slate-400">Schedule</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ dateRange(row) }}</dd>
          </div>
          <div v-if="row.code" class="flex justify-between gap-2">
            <dt class="text-slate-400">Code</dt>
            <dd class="font-mono text-slate-700 dark:text-slate-200">{{ row.code }}</dd>
          </div>
        </dl>

        <div class="mt-3 flex gap-1.5" @click.stop>
          <Button variant="secondary" size="sm" block icon="eye" @click="viewing = row">View</Button>
          <Button
            v-if="auth.can('editDiscounts')"
            variant="secondary"
            size="sm"
            block
            icon="edit"
            @click="router.push(`/discounts/${row.id}/edit`)"
          >
            Edit
          </Button>
          <Dropdown v-if="auth.can('toggleDiscounts')" variant="ghost" size="sm" width="w-44">
            <template #trigger><Icon name="sliders" size="w-4 h-4" /></template>
            <DropdownItem icon="layers" @click="duplicate(row)">Duplicate</DropdownItem>
            <DropdownItem :icon="row.active ? 'x' : 'check'" @click="toggle(row)">
              {{ row.active ? 'Deactivate' : 'Activate' }}
            </DropdownItem>
            <DropdownItem v-if="auth.can('deleteDiscounts')" icon="trash" danger @click="deleting = row">
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </template>
    </DataTable>

    <!-- view -->
    <Modal :open="!!viewing" :title="viewing?.name || ''" size="max-w-xl" @close="viewing = null">
      <DiscountSummary v-if="viewing" :discount="viewing" />
      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="viewing = null">{{ t('common.close') }}</Button>
          <Button
            v-if="auth.can('editDiscounts')"
            block
            icon="edit"
            @click="router.push(`/discounts/${viewing.id}/edit`)"
          >
            {{ t('common.edit') }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- delete -->
    <ConfirmDialog
      :open="!!deleting"
      :title="t('discounts.deleteTitle')"
      :message="t('discounts.deleteHint', { name: deleting?.name })"
      :confirm-label="t('common.delete')"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
