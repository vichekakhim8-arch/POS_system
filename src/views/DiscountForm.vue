<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Icon from '@/components/ui/Icon.vue'
import Badge from '@/components/ui/Badge.vue'
import TargetSelector from '@/components/discounts/TargetSelector.vue'
import { useDiscountsStore, emptyDiscount, resolveStatus } from '@/stores/discounts'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { round2 } from '@/utils/helpers'
import { useAction } from '@/composables/useAction'

const route = useRoute()
const router = useRouter()
const discounts = useDiscountsStore()
const products = useProductsStore()
const customers = useCustomersStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const editing = computed(() => !!route.params.id)
const source = editing.value ? discounts.byId(route.params.id) : null

const form = reactive(source ? { ...JSON.parse(JSON.stringify(source)) } : emptyDiscount())
const errors = reactive({ name: '', value: '', endDate: '', target: '', code: '' })
const advancedOpen = ref(false)
const saving = ref(false)

const suffix = computed(() => (form.type === 'percentage' ? '%' : settings.currency))

const previewStatus = computed(() => resolveStatus({ ...form, usageCount: form.usageCount || 0 }))

/** Live count of products the current rule would touch. */
const affectedProducts = computed(() => {
  if (form.applyTo === 'all') return products.total
  if (form.applyTo === 'categories') {
    const names = form.categoryIds
      .map((id) => products.categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
    return products.items.filter((p) => names.includes(p.category)).length
  }
  if (form.applyTo === 'products') return form.productIds.length
  return form.variantIds.length
})

/** Example maths shown to the owner while configuring. */
const example = computed(() => {
  const base = 10
  const raw = form.type === 'percentage' ? (base * (Number(form.value) || 0)) / 100 : Number(form.value) || 0
  const capped = form.maximumDiscount ? Math.min(raw, Number(form.maximumDiscount)) : raw
  const amount = round2(Math.min(Math.max(capped, 0), base))
  return { base, amount, final: round2(base - amount) }
})

const conflicts = computed(() => discounts.conflictsFor({ ...form, id: form.id }))

const validate = () => {
  errors.name = form.name.trim() ? '' : 'Discount name is required.'
  errors.value = Number(form.value) > 0 ? '' : 'Enter a value greater than zero.'
  if (form.type === 'percentage' && Number(form.value) > 100)
    errors.value = 'Percentage cannot exceed 100%.'
  errors.endDate =
    form.startDate && form.endDate && form.endDate < form.startDate
      ? 'End date must be after the start date.'
      : ''
  errors.code = form.requiresCode && !form.code.trim() ? 'A code is required when customers must enter one.' : ''
  errors.target =
    (form.applyTo === 'categories' && !form.categoryIds.length) ||
    (form.applyTo === 'products' && !form.productIds.length) ||
    (form.applyTo === 'variants' && !form.variantIds.length)
      ? 'Select at least one target.'
      : ''
  return !Object.values(errors).some(Boolean)
}

const save = async () => {
  if (!validate()) {
    ui.notify('Please fix the highlighted fields', 'error')
    return
  }
  saving.value = true
  await run(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (editing.value) {
            discounts.update(route.params.id, form)
            ui.notify(`${form.name} updated`)
          } else {
            const created = discounts.create(form)
            ui.notify(`${created.name} saved — status ${resolveStatus(created)}`)
          }
          resolve()
        }, 400)
      }),
    { message: t('common.saving'), minMs: 400 }
  )
  saving.value = false
  router.push('/discounts')
}

const generateCode = () => {
  const slug = (form.name || 'SAVE').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
  form.code = `${slug || 'SAVE'}${Math.floor(10 + Math.random() * 89)}`
}
</script>

<template>
  <div class="max-w-6xl">
    <PageHeader
      :title="editing ? 'Edit discount' : 'Create discount'"
      :subtitle="editing ? form.name : 'Set up a new campaign for your store'"
      back-to="/discounts"
    >
      <template #actions>
        <Badge :type="previewStatus" dot />
        <Button variant="secondary" @click="router.push('/discounts')">{{ t('common.cancel') }}</Button>
        <Button icon="check" :loading="saving" @click="save">
          {{ editing ? t('common.saveChanges') : 'Save discount' }}
        </Button>
      </template>
    </PageHeader>

    <form class="grid lg:grid-cols-3 gap-5" @submit.prevent="save">
      <!-- main column -->
      <div class="lg:col-span-2 space-y-5 min-w-0">
        <!-- basics -->
        <section class="card p-5 space-y-4">
          <h3 class="font-semibold text-slate-900 dark:text-white">Discount details</h3>

          <Input
            v-model="form.name"
            label="Discount name *"
            icon="sparkles"
            placeholder="Weekend Promotion"
            :error="errors.name"
          />
          <Input v-model="form.description" label="Description" placeholder="Short internal note" />

          <div>
            <p class="label">Discount type</p>
            <div class="grid sm:grid-cols-2 gap-2.5">
              <button
                v-for="option in [
                  { value: 'percentage', label: 'Percentage (%)', hint: 'e.g. 20% OFF' },
                  { value: 'fixed', label: `Fixed amount (${settings.currency})`, hint: `e.g. ${settings.currency}2 OFF` }
                ]"
                :key="option.value"
                type="button"
                class="flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition"
                :class="
                  form.type === option.value
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                "
                @click="form.type = option.value"
              >
                <span
                  class="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                  :class="form.type === option.value ? 'border-brand-600' : 'border-slate-300 dark:border-slate-600'"
                >
                  <span v-if="form.type === option.value" class="w-2.5 h-2.5 rounded-full bg-brand-600" />
                </span>
                <span>
                  <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {{ option.label }}
                  </span>
                  <span class="block text-xs text-slate-400">{{ option.hint }}</span>
                </span>
              </button>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <Input
              v-model="form.value"
              label="Discount value *"
              type="number"
              min="0"
              step="0.01"
              :max="form.type === 'percentage' ? 100 : null"
              :suffix-text="suffix"
              :error="errors.value"
            />
            <div class="rounded-xl bg-surface-subtle p-3 text-sm self-end">
              <p class="text-xs text-slate-400">Example on a {{ settings.money(example.base) }} item</p>
              <p class="font-semibold text-slate-800 dark:text-slate-100">
                <span class="line-through text-slate-400 mr-1.5">{{ settings.money(example.base) }}</span>
                {{ settings.money(example.final) }}
                <span class="text-discount text-xs font-bold ml-1">−{{ settings.money(example.amount) }}</span>
              </p>
            </div>
          </div>
        </section>

        <!-- targeting -->
        <section class="card p-5 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold text-slate-900 dark:text-white">Apply discount to</h3>
            <span class="text-xs font-semibold text-brand-600">{{ affectedProducts }} targeted</span>
          </div>

          <TargetSelector
            v-model:apply-to="form.applyTo"
            v-model:category-ids="form.categoryIds"
            v-model:product-ids="form.productIds"
            v-model:variant-ids="form.variantIds"
          />

          <p v-if="errors.target" class="text-xs font-medium text-rose-600">{{ errors.target }}</p>
        </section>

        <!-- schedule -->
        <section class="card p-5 space-y-4">
          <h3 class="font-semibold text-slate-900 dark:text-white">Schedule</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <Input v-model="form.startDate" label="Start date" type="date" />
            <Input v-model="form.endDate" label="End date" type="date" :error="errors.endDate" />
            <Input v-model="form.startTime" label="Start time" type="time" />
            <Input v-model="form.endTime" label="End time" type="time" />
          </div>

          <label
            class="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition"
            :class="form.active ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5' : 'border-slate-200 dark:border-slate-700'"
          >
            <span>
              <span class="block text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
              <span class="block text-xs text-slate-400">
                Status is calculated automatically from the schedule.
              </span>
            </span>
            <input v-model="form.active" type="checkbox" class="w-5 h-5 rounded accent-brand-600" />
          </label>
        </section>

        <!-- advanced -->
        <section class="card overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
            @click="advancedOpen = !advancedOpen"
          >
            <span class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Icon name="sliders" size="w-4 h-4" />
            </span>
            <span class="grow">
              <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Advanced options
              </span>
              <span class="block text-xs text-slate-400">
                Conditions, discount code and customer eligibility
              </span>
            </span>
            <Icon
              name="chevronRight"
              size="w-4 h-4"
              class="text-slate-400 transition-transform duration-300"
              :class="advancedOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
            :style="{ gridTemplateRows: advancedOpen ? '1fr' : '0fr', opacity: advancedOpen ? 1 : 0 }"
          >
            <div class="overflow-hidden">
              <div class="px-5 pb-5 space-y-5 border-t border-slate-200 dark:border-slate-800 pt-5">
                <div>
                  <p class="label">Conditions</p>
                  <div class="grid sm:grid-cols-2 gap-4">
                    <Input
                      v-model="form.minimumOrderAmount"
                      label="Minimum order amount"
                      type="number"
                      min="0"
                      step="0.01"
                      :suffix-text="settings.currency"
                    />
                    <Input
                      v-model="form.maximumDiscount"
                      label="Maximum discount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      :suffix-text="settings.currency"
                    />
                    <Input
                      v-model="form.usageLimit"
                      label="Usage limit"
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                    />
                    <Input
                      v-model="form.perCustomerLimit"
                      label="Per customer limit"
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <p class="label">Discount code</p>
                  <div class="flex gap-2">
                    <Input v-model="form.code" placeholder="WEEKEND20" class="grow" :error="errors.code" />
                    <Button type="button" variant="secondary" icon="refresh" @click="generateCode">
                      Generate
                    </Button>
                  </div>
                  <label class="flex items-center gap-2.5 mt-2.5 cursor-pointer">
                    <input v-model="form.requiresCode" type="checkbox" class="w-4 h-4 rounded accent-brand-600" />
                    <span class="text-sm text-slate-600 dark:text-slate-300">
                      Require discount code — customers must enter it at checkout
                    </span>
                  </label>
                </div>

                <div>
                  <p class="label">Customer eligibility</p>
                  <div class="grid sm:grid-cols-3 gap-2">
                    <button
                      v-for="option in [
                        { value: 'all', label: 'All customers' },
                        { value: 'group', label: 'Customer group' },
                        { value: 'specific', label: 'Specific customers' }
                      ]"
                      :key="option.value"
                      type="button"
                      class="px-3 py-2.5 rounded-xl border text-sm font-medium transition"
                      :class="
                        form.customerEligibility === option.value
                          ? 'border-brand-500 text-brand-600 bg-brand-50/60 dark:bg-brand-500/10'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      "
                      @click="form.customerEligibility = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>

                  <Select
                    v-if="form.customerEligibility === 'group'"
                    v-model="form.customerGroup"
                    class="mt-3"
                    :options="['Regular', 'VIP', 'Wholesale', 'Staff']"
                  />

                  <div
                    v-else-if="form.customerEligibility === 'specific'"
                    class="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800"
                  >
                    <label
                      v-for="customer in customers.items"
                      :key="customer.id"
                      class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        class="w-4 h-4 rounded accent-brand-600"
                        :checked="form.customerIds.includes(customer.id)"
                        @change="
                          form.customerIds = form.customerIds.includes(customer.id)
                            ? form.customerIds.filter((id) => id !== customer.id)
                            : [...form.customerIds, customer.id]
                        "
                      />
                      <span class="text-sm text-slate-700 dark:text-slate-200 grow truncate">
                        {{ customer.name }}
                      </span>
                      <span class="text-xs text-slate-400">{{ customer.phone }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- side column -->
      <aside class="space-y-5 lg:sticky lg:top-4 h-fit min-w-0">
        <section class="card p-5">
          <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Summary</h3>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400">Status</dt>
              <dd><Badge :type="previewStatus" dot /></dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400">Value</dt>
              <dd class="font-bold text-brand-600">
                {{ form.type === 'percentage' ? `${form.value || 0}% OFF` : `${settings.money(form.value || 0)} OFF` }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400">Targets</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-100">{{ affectedProducts }} products</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400">Code</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-100">
                {{ form.code || 'Automatic' }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="conflicts.length" class="card p-5 border-amber-300 dark:border-amber-500/30">
          <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Icon name="alert" size="w-4 h-4" class="text-amber-500" /> Possible conflicts
          </h3>
          <p class="text-xs text-slate-500 mb-3">
            These active campaigns target the same scope. Stacking is disabled — the greater customer
            benefit wins.
          </p>
          <ul class="space-y-1.5">
            <li
              v-for="conflict in conflicts"
              :key="conflict.id"
              class="flex items-center justify-between gap-2 text-sm"
            >
              <span class="text-slate-700 dark:text-slate-200 truncate">{{ conflict.name }}</span>
              <span class="text-xs font-bold text-brand-600 shrink-0">
                {{ conflict.type === 'percentage' ? `${conflict.value}%` : settings.money(conflict.value) }}
              </span>
            </li>
          </ul>
        </section>

        <section class="card p-5">
          <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Priority rules</h3>
          <ol class="space-y-1.5 text-xs text-slate-500 list-decimal list-inside">
            <li>Product-specific discount</li>
            <li>Variant-specific discount</li>
            <li>Category discount</li>
            <li>All products discount</li>
          </ol>
          <p class="mt-3 text-xs text-slate-400">
            Discounts never stack — 10% and 20% will never combine into 30%.
          </p>
        </section>
      </aside>
    </form>
  </div>
</template>
