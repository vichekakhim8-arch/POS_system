<script setup>
import { ref } from 'vue'
import Dropdown from './Dropdown.vue'
import DropdownItem from './DropdownItem.vue'
import { exportCsv, exportExcel, exportPdf, importSpreadsheet } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  filename: { type: String, required: true },
  title: { type: String, default: 'Report' },
  subtitle: { type: String, default: '' },
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  summary: { type: Array, default: () => [] },
  meta: { type: Array, default: () => [] },
  formats: { type: Array, default: () => ['excel', 'csv', 'pdf'] },
  allowImport: { type: Boolean, default: false },
  orientation: { type: String, default: 'portrait' },
  variant: { type: String, default: 'secondary' },
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['imported'])

const { t } = useI18n()
const ui = useUiStore()
const settings = useSettingsStore()
const fileInput = ref(null)

const baseMeta = () => [
  `${settings.store} · ${settings.phone}`,
  settings.address,
  ...props.meta
]

const run = (type) => {
  if (!props.rows.length) return ui.notify(t('common.noData'), 'error')
  const payload = { filename: props.filename, columns: props.columns, rows: props.rows }
  if (type === 'excel') exportExcel({ ...payload, sheetName: props.title, title: props.title })
  if (type === 'csv') exportCsv(payload)
  if (type === 'pdf')
    exportPdf({
      ...payload,
      title: props.title,
      subtitle: props.subtitle,
      meta: baseMeta(),
      summary: props.summary,
      orientation: props.orientation
    })
  ui.notify(t('exports.done', { name: props.title }))
}

const onImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const rows = await importSpreadsheet(file)
    emit('imported', rows)
    ui.notify(t('exports.imported', { count: rows.length }))
  } catch {
    ui.notify('Could not read that file', 'error')
  }
  event.target.value = ''
}
</script>

<template>
  <Dropdown :label="t('common.export')" icon="download" :variant="variant" :size="size" width="w-64">
    <DropdownItem v-if="formats.includes('excel')" icon="chart" hint=".xlsx" @click="run('excel')">
      {{ t('exports.excel') }}
    </DropdownItem>
    <DropdownItem v-if="formats.includes('csv')" icon="clipboard" hint=".csv" @click="run('csv')">
      {{ t('exports.csv') }}
    </DropdownItem>
    <DropdownItem v-if="formats.includes('pdf')" icon="print" hint=".pdf" @click="run('pdf')">
      {{ t('exports.pdf') }}
    </DropdownItem>

    <template v-if="allowImport">
      <div class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
      <DropdownItem icon="download" @click="fileInput?.click()">
        {{ t('exports.importExcel') }}
      </DropdownItem>
    </template>
  </Dropdown>

  <input
    v-if="allowImport"
    ref="fileInput"
    type="file"
    accept=".xlsx,.xls,.csv"
    class="hidden"
    @change="onImport"
  />
</template>
