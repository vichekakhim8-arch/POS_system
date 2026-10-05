<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import QrCode from '@/components/ui/QrCode.vue'
import { useSettingsStore } from '@/stores/settings'
import { useCurrencyStore } from '@/stores/currency'
import { round2, uid } from '@/utils/helpers'

const props = defineProps({
  open: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  processing: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useI18n()
const settings = useSettingsStore()
const currency = useCurrencyStore()

const methodIcons = { Cash: 'cash', KHQR: 'qr', Card: 'card', 'Bank Transfer': 'bank' }
const method = ref('Cash')
const cashReceived = ref('')
const reference = ref(uid('TXN'))

const methods = computed(() => settings.enabledPaymentMethods)

/* Cash is entered in the active DISPLAY currency; totals are stored in the
   base currency. Convert once here so the maths stays correct in any currency. */
const totalDisplay = computed(() => currency.convert(props.total))
const receivedDisplay = computed(() => parseFloat(cashReceived.value) || 0)
/** Change expressed in BASE currency (what the order record stores). */
const change = computed(() =>
  round2(Math.max(0, (receivedDisplay.value - totalDisplay.value) / currency.active.rate))
)
const canConfirm = computed(
  () => method.value !== 'Cash' || receivedDisplay.value >= totalDisplay.value - 0.001
)

/** EMV-style payload so the QR scans as a real, structured payment string. */
const qrPayload = computed(() =>
  [
    '00020101021229',
    `30${settings.store.replace(/\s+/g, '').slice(0, 20)}`,
    `5204599953038405802KH`,
    `59${settings.store.slice(0, 25)}`,
    `6011Phnom Penh`,
    `54${props.total.toFixed(2)}`,
    `62${reference.value}`
  ].join('|')
)

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

const tap = (key) => {
  if (key === '⌫') cashReceived.value = String(cashReceived.value).slice(0, -1)
  else if (key === '.' && String(cashReceived.value).includes('.')) return
  else cashReceived.value = `${cashReceived.value}${key}`
}

/** Tender suggestions expressed in the active display currency. */
const quickAmounts = computed(() => {
  const due = totalDisplay.value
  const notes = currency.isBase ? [1, 5, 10, 20, 50, 100] : [5000, 10000, 20000, 50000, 100000]
  const exact = Number(due.toFixed(currency.active.decimals))
  return [...new Set([exact, ...notes.filter((n) => n >= due)])].slice(0, 5)
})

const formatTender = (amount) =>
  currency.active.position === 'before'
    ? `${currency.active.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: currency.active.decimals, maximumFractionDigits: currency.active.decimals })}`
    : `${amount.toLocaleString('en-US')} ${currency.active.symbol}`

watch(
  () => props.open,
  (value) => {
    if (!value) return
    method.value = methods.value[0] || 'Cash'
    cashReceived.value = ''
    reference.value = uid('TXN')
  }
)

const confirm = () => {
  if (!canConfirm.value) return
  // Convert the tendered amount back to base currency before saving the order.
  const paidBase =
    method.value === 'Cash'
      ? round2((receivedDisplay.value || totalDisplay.value) / currency.active.rate)
      : props.total
  emit('confirm', {
    method: method.value,
    paid: paidBase,
    change: method.value === 'Cash' ? change.value : 0
  })
}
</script>

<template>
  <Modal :open="open" :title="t('pos.payment')" size="max-w-3xl" @close="emit('close')">
    <div class="grid md:grid-cols-[200px_1fr] gap-5">
      <!-- method rail -->
      <div class="space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {{ t('pos.paymentMethod') }}
        </p>
        <button
          v-for="m in methods"
          :key="m"
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm font-medium transition duration-150"
          :class="
            method === m
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300'
          "
          @click="method = m"
        >
          <span
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :class="method === m ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'"
          >
            <Icon :name="methodIcons[m] || 'wallet'" size="w-4 h-4" />
          </span>
          {{ m }}
        </button>

        <div class="rounded-xl bg-slate-900 dark:bg-slate-800 text-white p-3.5 mt-3">
          <p class="text-[11px] uppercase tracking-wider text-white/60">{{ t('common.grandTotal') }}</p>
          <p class="text-2xl font-bold">{{ settings.money(total) }}</p>
        </div>
      </div>

      <!-- method panel -->
      <div class="min-h-[320px]">
        <Transition name="fade" mode="out-in">
          <!-- CASH -->
          <div :key="method" class="h-full">
            <template v-if="method === 'Cash'">
              <label class="label">{{ t('pos.cashReceived') }}</label>
              <div
                class="rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-3xl font-bold text-slate-900 dark:text-white tabular-nums"
              >
                <span v-if="currency.active.position === 'before'">{{ currency.active.symbol }}</span>
                {{ cashReceived || '0.00' }}
                <span v-if="currency.active.position === 'after'">{{ currency.active.symbol }}</span>
              </div>
              <p v-if="!currency.isBase" class="mt-1 text-[11px] text-slate-400 text-right">
                Entered in {{ currency.active.code }} · {{ currency.rateLabel }}
              </p>

              <div class="flex flex-wrap gap-2 mt-3">
                <button
                  v-for="amount in quickAmounts"
                  :key="amount"
                  class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 transition"
                  @click="cashReceived = Number(amount).toFixed(currency.active.decimals)"
                >
                  {{ formatTender(amount) }}
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2 mt-3">
                <button
                  v-for="key in keypad"
                  :key="key"
                  class="py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 active:scale-95 transition"
                  @click="tap(key)"
                >
                  {{ key }}
                </button>
              </div>

              <div
                class="mt-3 flex items-center justify-between p-3.5 rounded-xl transition-colors"
                :class="
                  change > 0
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-800'
                "
              >
                <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">{{ t('pos.change') }}</span>
                <span
                  class="text-2xl font-bold"
                  :class="change > 0 ? 'text-emerald-600' : 'text-slate-400'"
                >
                  {{ settings.money(change) }}
                </span>
              </div>
            </template>

            <!-- KHQR -->
            <template v-else-if="method === 'KHQR'">
              <div
                class="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col"
              >
                <div class="bg-[#e21c21] text-white px-4 py-2.5 flex items-center justify-between">
                  <span class="font-bold tracking-wide text-sm">KHQR</span>
                  <span class="text-[11px] opacity-90">Scan with any Cambodian banking app</span>
                </div>
                <div class="p-5 text-center bg-white dark:bg-slate-900 grow flex flex-col items-center justify-center">
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ settings.store }}</p>
                  <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {{ settings.money(total) }}
                  </p>
                  <div class="mt-4 p-3 rounded-2xl bg-white border border-slate-200 inline-block">
                    <QrCode :value="qrPayload" :size="190" />
                  </div>
                  <p class="mt-3 text-xs text-slate-400">{{ t('pos.scanToPay') }} · Ref {{ reference }}</p>
                </div>
              </div>
            </template>

            <!-- CARD / BANK -->
            <template v-else>
              <div
                class="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-full flex flex-col items-center justify-center text-center"
              >
                <span
                  class="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center"
                >
                  <Icon :name="methodIcons[method]" size="w-8 h-8" />
                </span>
                <p class="mt-4 font-semibold text-slate-900 dark:text-white">{{ method }}</p>
                <p class="mt-1 text-sm text-slate-500 max-w-xs">
                  Process {{ settings.money(total) }} on the
                  {{ method === 'Card' ? 'card terminal' : 'banking app' }}, then confirm below.
                </p>
                <p class="mt-4 text-xs font-mono text-slate-400">Ref {{ reference }}</p>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button variant="secondary" block :disabled="processing" @click="emit('close')">
          {{ t('common.cancel') }}
        </Button>
        <Button
          block
          size="lg"
          :loading="processing"
          :disabled="!canConfirm"
          data-loading-key="pos.processingPayment"
          @click="confirm"
        >
          {{ t('pos.confirmPayment') }} · {{ settings.money(total) }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
