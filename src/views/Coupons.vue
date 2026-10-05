<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useDiscountsStore } from '@/stores/discounts'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const discounts = useDiscountsStore()
const settings = useSettingsStore()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

/** Coupons are discounts that carry a code — same engine, filtered view. */
const rows = computed(() => discounts.withStatus.filter((d) => d.code))

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'requiresCode', label: 'Required' },
  { key: 'usageCount', label: 'Used', align: 'right', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: '', align: 'right', cardHide: true, sticky: true }
]

const exportColumns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Campaign' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'usageCount', label: 'Times used', align: 'right' },
  { key: 'usageLimit', label: 'Usage limit', align: 'right', format: (v) => v ?? 'Unlimited' },
  { key: 'status', label: 'Status' }
]

const copy = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    ui.notify(`${code} copied to clipboard`)
  } catch {
    ui.notify('Could not copy the code', 'error')
  }
}
</script>

<template>
  <div>
    <PageHeader icon="qr" :title="t('nav.coupons')" :subtitle="`${rows.length} coupon codes`">
      <template #actions>
        <ExportMenu
          filename="coupons"
          title="Coupon codes"
          :columns="exportColumns"
          :rows="rows"
          :formats="['excel', 'csv']"
        />
        <Button
          v-if="auth.can('createDiscounts')"
          icon="plus"
          @click="router.push('/discounts/new')"
        >
          Create coupon
        </Button>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="rows"
      min-width="min-w-[780px]"
      empty-icon="qr"
      empty-text="No coupon codes yet. Add a code to any discount to create one."
      card-columns="sm:grid-cols-2 xl:grid-cols-3"
    >
      <template #cell-code="{ row }">
        <span class="inline-flex items-center gap-2">
          <span class="font-mono font-bold text-brand-600">{{ row.code }}</span>
          <button class="icon-btn" title="Copy code" @click.stop="copy(row.code)">
            <Icon name="clipboard" size="w-3.5 h-3.5" />
          </button>
        </span>
      </template>
      <template #cell-name="{ row }">
        <span class="font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
      </template>
      <template #cell-value="{ row }">
        <span class="font-bold text-brand-600">
          {{ row.type === 'percentage' ? `${row.value}%` : settings.money(row.value) }} OFF
        </span>
      </template>
      <template #cell-requiresCode="{ row }">
        <Badge :type="row.requiresCode ? 'info' : 'neutral'">
          {{ row.requiresCode ? 'Code required' : 'Automatic' }}
        </Badge>
      </template>
      <template #cell-usageCount="{ row }">
        {{ row.usageCount }}<span v-if="row.usageLimit" class="text-slate-400"> / {{ row.usageLimit }}</span>
      </template>
      <template #cell-status="{ row }"><Badge :type="row.status" dot /></template>
      <template #cell-actions="{ row }">
        <RowActions
          :show-edit="auth.can('editDiscounts')"
          edit-label="Edit"
          @edit="router.push(`/discounts/${row.id}/edit`)"
        />
      </template>
    </DataTable>
  </div>
</template>
