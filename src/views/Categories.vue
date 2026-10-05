<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { CHART_COLORS, round2 } from '@/utils/helpers'
import { useAction } from '@/composables/useAction'

const products = useProductsStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const open = ref(false)
const editing = ref(null)
const deleting = ref(null)
const form = reactive({ name: '', description: '', color: CHART_COLORS[0] })

const rows = computed(() =>
  products.categories.map((category) => {
    const items = products.items.filter((p) => p.category === category.name)
    return {
      ...category,
      count: items.length,
      stock: items.reduce((s, p) => s + p.stock, 0),
      value: round2(items.reduce((s, p) => s + p.price * p.stock, 0))
    }
  })
)

const exportColumns = [
  { key: 'name', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'count', label: 'Products', align: 'right' },
  { key: 'stock', label: 'Units in stock', align: 'right' },
  { key: 'value', label: 'Retail value', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const openCreate = () => {
  editing.value = null
  Object.assign(form, {
    name: '',
    description: '',
    color: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)]
  })
  open.value = true
}

const openEdit = (category) => {
  editing.value = category
  Object.assign(form, { name: category.name, description: category.description, color: category.color })
  open.value = true
}

const save = async () => {
  if (!form.name.trim()) return ui.notify('Category name is required', 'error')
  await run(() => {
    if (editing.value) products.updateCategory(editing.value.id, { ...form })
    else products.addCategory({ ...form })
  }, { message: t('common.saving') })
  ui.notify(t('common.save'))
  open.value = false
}

const requestRemove = (category) => {
  deleting.value = category
}

const confirmRemove = async () => {
  const category = deleting.value
  if (!category) return
  let ok = false
  await run(() => {
    ok = products.removeCategory(category.id)
  }, { message: t('common.deleting') })
  ui.notify(ok ? t('common.deleted') : 'Category still has products', ok ? 'success' : 'error')
  deleting.value = null
}
</script>

<template>
  <div>
    <PageHeader
      icon="tag"
      :title="t('nav.categories')"
      :subtitle="`${products.categories.length} categories`"
    >
      <template #actions>
        <ExportMenu
          filename="categories"
          :title="t('nav.categories')"
          :columns="exportColumns"
          :rows="rows"
          :formats="['excel', 'csv']"
        />
        <Button icon="plus" @click="openCreate">{{ t('common.add') }}</Button>
      </template>
    </PageHeader>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <article
        v-for="category in rows"
        :key="category.id"
        class="card card-hover p-5 min-h-[190px] flex flex-col animate-rise"
      >
        <div class="flex items-start justify-between">
          <span
            class="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
            :style="{ background: category.color }"
          >
            <Icon name="tag" />
          </span>
          <div class="flex gap-1">
            <button
              class="icon-btn"
              :title="t('common.edit')"
              :aria-label="t('common.edit')"
              data-loading-key="common.loading"
              @click="openEdit(category)"
            >
              <Icon name="edit" size="w-4 h-4" />
            </button>
            <button
              class="icon-btn-danger"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
              data-loading-key="common.deleting"
              @click="requestRemove(category)"
            >
              <Icon name="trash" size="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 class="mt-3.5 font-semibold text-slate-900 dark:text-white">{{ category.name }}</h3>
        <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">{{ category.description }}</p>

        <div class="mt-auto pt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ category.count }}</p>
            <p class="text-[10px] text-slate-400">Products</p>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ category.stock }}</p>
            <p class="text-[10px] text-slate-400">Units</p>
          </div>
          <div>
            <p class="text-sm font-bold text-brand-600">{{ settings.money(category.value) }}</p>
            <p class="text-[10px] text-slate-400">Value</p>
          </div>
        </div>
      </article>
    </div>

    <Modal :open="open" :title="editing ? t('common.edit') : t('common.add')" size="max-w-md" @close="open = false">
      <div class="space-y-4">
        <Input v-model="form.name" :label="t('common.name')" icon="tag" placeholder="Frozen food" />
        <Input v-model="form.description" label="Description" placeholder="Short description" />
        <div>
          <span class="label">Colour</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in CHART_COLORS"
              :key="color"
              class="w-9 h-9 rounded-xl transition"
              :class="form.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110' : ''"
              :style="{ background: color }"
              @click="form.color = color"
            />
          </div>
        </div>
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
      title="Delete category?"
      :message="`&quot;${deleting?.name}&quot; will be removed. Products in this category keep their stock.`"
      confirm-label="Delete"
      @close="deleting = null"
      @confirm="confirmRemove"
    />
  </div>
</template>
