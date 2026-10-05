<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Icon from '@/components/ui/Icon.vue'
import ThemeCustomizer from '@/components/settings/ThemeCustomizer.vue'
import BakongSettings from '@/components/settings/BakongSettings.vue'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher.vue'
import { useCurrencyStore } from '@/stores/currency'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { availableLocales, setLocale } from '@/i18n'
import { useAction } from '@/composables/useAction'

const settings = useSettingsStore()
const currency = useCurrencyStore()
const ui = useUiStore()
const { t, locale } = useI18n()

const tabs = [
  { key: 'business', labelKey: 'settings.business', icon: 'store' },
  { key: 'appearance', labelKey: 'settings.appearance', icon: 'palette' },
  { key: 'localization', labelKey: 'settings.localization', icon: 'globe' },
  { key: 'payment', labelKey: 'settings.payments', icon: 'wallet' },
  { key: 'receipt', labelKey: 'settings.receipt', icon: 'print' },
  { key: 'system', labelKey: 'settings.system', icon: 'gear' }
]

const route = useRoute()
const { run } = useAction()
const tab = ref(tabs.some((x) => x.key === route.query.tab) ? route.query.tab : 'business')
const fullscreen = ref(false)
const logoInput = ref(null)

const onLogo = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => (settings.logo = reader.result)
  reader.readAsDataURL(file)
  ui.notify(t('common.save'))
}

/** Settings persist per keystroke in the Pinia store, so "saving" is just the
 *  confirmation beat: keep the overlay honest with a short, real delay. */
const save = async () => {
  await run(() => new Promise((r) => setTimeout(r, 200)), {
    message: t('common.saving'),
    minMs: 500
  })
  ui.notify(t('common.saveChanges'))
}
const resetDemo = () => window.location.reload()
</script>

<template>
  <div
    :class="
      fullscreen
        ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 overflow-y-auto p-4 sm:p-8'
        : 'max-w-6xl'
    "
  >
    <PageHeader icon="gear" :title="t('settings.title')" :subtitle="t('settings.subtitle')">
      <template #actions>
        <Button variant="secondary" :icon="fullscreen ? 'x' : 'layers'" @click="fullscreen = !fullscreen">
          {{ fullscreen ? t('common.exitFullscreen') : t('common.fullscreen') }}
        </Button>
        <Button icon="check" @click="save">{{ t('common.saveChanges') }}</Button>
      </template>
    </PageHeader>

    <div class="grid lg:grid-cols-[250px_1fr] gap-5">
      <nav class="card p-2 h-fit lg:sticky lg:top-4">
        <button
          v-for="x in tabs"
          :key="x.key"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition duration-150"
          :class="
            tab === x.key
              ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          "
          @click="tab = x.key"
        >
          <Icon :name="x.icon" size="w-4 h-4" />
          {{ t(x.labelKey) }}
        </button>
      </nav>

      <Transition name="fade" mode="out-in">
        <div :key="tab">
          <!-- Business -->
          <section v-if="tab === 'business'" class="card p-5 space-y-4">
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('settings.business') }}</h3>

            <div class="flex flex-wrap items-center gap-4">
              <span
                class="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center overflow-hidden shrink-0"
              >
                <img v-if="settings.logo" :src="settings.logo" alt="" class="w-full h-full object-cover" />
                <Icon v-else name="store" size="w-7 h-7" />
              </span>
              <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogo" />
              <Button variant="secondary" icon="download" @click="logoInput?.click()">Upload logo</Button>
              <Button v-if="settings.logo" variant="ghost" @click="settings.logo = ''">{{ t('common.delete') }}</Button>
            </div>

            <Input v-model="settings.store" :label="t('auth.storeName')" icon="store" />
            <div class="grid sm:grid-cols-2 gap-4">
              <Input v-model="settings.phone" :label="t('common.phone')" icon="bell" />
              <Input v-model="settings.email" :label="t('common.email')" type="email" />
            </div>
            <Input v-model="settings.address" :label="t('common.address')" :rows="2" />
          </section>

          <!-- Payments -->
          <section v-if="tab === 'payment'" class="card p-5 space-y-4">
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('settings.payments') }}</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <span class="label">Display currency</span>
                <div
                  class="flex items-center justify-between gap-3 px-3.5 py-2 border border-slate-200 dark:border-slate-700"
                  :style="{ borderRadius: 'var(--radius-xl)', background: 'var(--c-input)' }"
                >
                  <span class="text-sm text-slate-600 dark:text-slate-300 truncate">
                    {{ currency.active.flag }} {{ currency.active.code }} — {{ currency.active.name }}
                  </span>
                  <button
                    class="text-xs font-semibold text-brand-600 hover:underline shrink-0"
                    @click="tab = 'localization'"
                  >
                    Change
                  </button>
                </div>
              </div>
              <Input
                v-model.number="settings.taxRate"
                :label="`${t('common.tax')} (%)`"
                type="number"
                step="0.1"
                min="0"
                suffix-text="%"
              />
            </div>

            <h4 class="font-semibold text-slate-900 dark:text-white pt-2">{{ t('pos.paymentMethod') }}</h4>
            <div class="grid sm:grid-cols-2 gap-2">
              <label
                v-for="(enabled, name) in settings.paymentMethods"
                :key="name"
                class="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition"
                :class="
                  enabled
                    ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5'
                    : 'border-slate-200 dark:border-slate-700'
                "
              >
                <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ name }}</span>
                <input
                  type="checkbox"
                  class="w-5 h-5 rounded accent-brand-600"
                  :checked="enabled"
                  @change="settings.togglePaymentMethod(name)"
                />
              </label>
            </div>
          </section>

          <!-- Bakong / KHQR gateway -->
          <BakongSettings v-if="tab === 'payment'" class="mt-5" />

          <!-- Receipt -->
          <section v-if="tab === 'receipt'" class="card p-5 space-y-4">
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('settings.receipt') }}</h3>
            <Input v-model="settings.receiptFooter" label="Receipt footer message" :rows="2" />

            <div
              class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 font-mono text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto"
            >
              <div class="text-center">
                <p class="font-bold text-sm uppercase">{{ settings.store }}</p>
                <p>{{ settings.address }}</p>
                <p>Tel: {{ settings.phone }}</p>
              </div>
              <div class="border-t border-dashed my-2" />
              <div class="flex justify-between"><span>1 × Sample product</span><span>{{ settings.currency }}9.99</span></div>
              <div class="border-t border-dashed my-2" />
              <div class="flex justify-between">
                <span>{{ t('common.tax') }} {{ settings.taxRate }}%</span><span>{{ settings.currency }}0.85</span>
              </div>
              <div class="flex justify-between font-bold"><span>TOTAL</span><span>{{ settings.currency }}10.84</span></div>
              <div class="border-t border-dashed my-2" />
              <p class="text-center">{{ settings.receiptFooter }}</p>
              <p class="text-center text-[10px] text-slate-400 mt-1">▌▌█▌▐█▌▌█▐▌ barcode + QR printed</p>
            </div>
          </section>

          <!-- Appearance & branding -->
          <section v-if="tab === 'appearance'" class="space-y-5">
            <div class="card p-5">
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('settings.language') }}</h3>
              <p class="text-xs text-slate-400 mt-0.5 mb-3">Applies to the whole interface.</p>
              <div class="grid sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  v-for="l in availableLocales"
                  :key="l.code"
                  type="button"
                  class="flex items-center gap-3 border-2 px-4 py-3 text-left transition
                         focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                  :class="locale === l.code ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'"
                  :style="{ borderRadius: 'var(--radius-2xl)' }"
                  @click="setLocale(l.code)"
                >
                  <span class="w-9 h-9 rounded-full grid place-items-center text-lg bg-white ring-1 ring-black/5 shrink-0">
                    {{ l.flag }}
                  </span>
                  <span class="min-w-0 grow">
                    <span
                      class="block text-sm font-semibold truncate"
                      :class="locale === l.code ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'"
                    >
                      {{ l.label }}
                    </span>
                    <span class="block text-xs text-slate-400">{{ l.native }}</span>
                  </span>
                  <Icon v-if="locale === l.code" name="check" size="w-5 h-5" class="text-brand-600 shrink-0" />
                </button>
              </div>
            </div>

            <ThemeCustomizer />
          </section>

          <!-- Localization -->
          <section v-if="tab === 'localization'" class="space-y-5">
            <div class="card p-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-900 dark:text-white">Currency</h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Display currency used across the entire system.
                  </p>
                </div>
                <CurrencySwitcher />
              </div>

              <div class="mt-4 space-y-2 max-w-xl">
                <p class="label">Available currencies</p>
                <button
                  v-for="item in currency.list"
                  :key="item.code"
                  class="w-full flex items-center gap-3 px-4 py-3 border-2 text-left transition"
                  :class="
                    currency.code === item.code
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                  "
                  :style="{ borderRadius: 'var(--radius-2xl)' }"
                  @click="currency.setCurrency(item.code)"
                >
                  <span class="text-2xl leading-none" aria-hidden="true">{{ item.flag }}</span>
                  <span class="min-w-0 grow">
                    <span
                      class="block text-sm font-semibold"
                      :class="currency.code === item.code ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'"
                    >
                      {{ item.code }} — {{ item.name }}
                    </span>
                    <span class="block text-xs text-slate-400">
                      Symbol {{ item.symbol }} ·
                      {{ item.code === 'USD' ? 'Base currency' : `1 USD ≈ ${item.rate.toLocaleString()} ${item.code}` }}
                    </span>
                  </span>
                  <Icon
                    v-if="currency.code === item.code"
                    name="check"
                    size="w-5 h-5"
                    class="text-brand-600 shrink-0"
                  />
                </button>
              </div>

              <div class="mt-4 p-4 rounded-2xl bg-surface-subtle">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Preview</p>
                <div class="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-slate-400">Product price</p>
                    <p class="font-bold text-slate-900 dark:text-white">{{ settings.money(2.5) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Order total</p>
                    <p class="font-bold text-slate-900 dark:text-white">{{ settings.money(48.9) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Monthly revenue</p>
                    <p class="font-bold text-slate-900 dark:text-white">{{ settings.money(12480) }}</p>
                  </div>
                </div>
              </div>

              <p class="mt-3 flex items-start gap-2 text-xs text-slate-400">
                <Icon name="alert" size="w-4 h-4" class="shrink-0 mt-px" />
                Prototype rates are mock values. Amounts are stored in USD and only the display is
                converted — business data is never modified.
              </p>
            </div>

            <div class="card p-5">
              <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Regional format</h3>
              <div class="grid sm:grid-cols-2 gap-4 max-w-xl">
                <Select
                  v-model="settings.language"
                  label="Interface language"
                  :options="['English', 'ភាសាខ្មែរ (Khmer)']"
                />
                <Input
                  v-model.number="settings.taxRate"
                  :label="`${t('common.tax')} (%)`"
                  type="number"
                  step="0.1"
                  min="0"
                  suffix-text="%"
                />
              </div>
            </div>
          </section>

          <!-- System -->
          <section v-if="tab === 'system'" class="card p-5 space-y-4">
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('settings.system') }}</h3>

            <Input
              v-model.number="settings.lowStockDefault"
              label="Default low stock alert"
              type="number"
              min="0"
              hint="Used as the default threshold for new products"
            />

            <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('settings.darkMode') }}</p>
                <p class="text-xs text-slate-400">Switch the interface theme</p>
              </div>
              <button
                class="w-12 h-7 rounded-full transition-colors relative"
                :class="ui.dark ? 'bg-brand-600' : 'bg-slate-300'"
                @click="ui.toggleDark()"
              >
                <span
                  class="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  :class="ui.dark ? 'left-6' : 'left-1'"
                />
              </button>
            </div>

            <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('settings.resetDemo') }}</p>
                <p class="text-xs text-slate-400">Restore the original sample dataset</p>
              </div>
              <Button variant="secondary" icon="refresh" @click="resetDemo">{{ t('common.confirm') }}</Button>
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </div>
</template>
