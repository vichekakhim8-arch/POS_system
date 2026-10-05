<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Barcode from '@/components/ui/Barcode.vue'
import QrCode from '@/components/ui/QrCode.vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  open: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['close', 'download'])

const { t } = useI18n()
const settings = useSettingsStore()

const barcodeValue = computed(() => (props.order?.id || 'ORD0000').replace(/[^A-Z0-9]/gi, ''))
const verifyPayload = computed(() =>
  props.order
    ? `${settings.store}|${props.order.id}|${props.order.date} ${props.order.time}|${props.order.total.toFixed(2)}`
    : ''
)

const print = () => window.print()
</script>

<template>
  <Modal :open="open" :title="t('pos.receipt')" size="max-w-sm" @close="emit('close')">
    <div
      v-if="order"
      id="receipt-print"
      class="font-mono text-[11.5px] leading-[1.55] text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
    >
      <!-- header -->
      <div class="text-center">
        <img
          v-if="settings.logo"
          :src="settings.logo"
          alt=""
          class="w-12 h-12 object-cover rounded-lg mx-auto mb-1.5"
        />
        <p class="font-bold text-[15px] tracking-wide uppercase">{{ settings.store }}</p>
        <p>{{ settings.address }}</p>
        <p>Tel: {{ settings.phone }}</p>
        <p>{{ settings.email }}</p>
      </div>

      <div class="my-2.5 border-t border-dashed border-slate-400" />

      <div class="grid grid-cols-[62px_1fr] gap-x-2">
        <span class="text-slate-500">Receipt</span><span class="font-bold">{{ order.id }}</span>
        <span class="text-slate-500">Date</span><span>{{ order.date }} {{ order.time }}</span>
        <span class="text-slate-500">Cashier</span><span>{{ order.cashier }}</span>
        <span class="text-slate-500">Customer</span><span>{{ order.customer }}</span>
        <span class="text-slate-500">Payment</span><span>{{ order.method }}</span>
      </div>

      <div class="my-2.5 border-t border-dashed border-slate-400" />

      <!-- items -->
      <table class="w-full">
        <thead>
          <tr class="text-[10px] uppercase text-slate-500">
            <th class="text-left font-semibold pb-1">Item</th>
            <th class="text-center font-semibold pb-1 w-8">Qty</th>
            <th class="text-right font-semibold pb-1 w-16">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in order.items" :key="item.key || index" class="align-top">
            <td class="pr-1">
              {{ item.name }}
              <div class="text-[10px] text-slate-500">
                @ {{ settings.money(item.price) }}
                <span v-if="item.discount"> − {{ settings.money(item.discount) }} ea</span>
              </div>
              <div v-if="item.discountName" class="text-[10px]">{{ item.discountName }}</div>
            </td>
            <td class="text-center">{{ item.qty }}</td>
            <td class="text-right">
              {{ settings.money(item.lineTotal ?? (item.price - (item.discount || 0)) * item.qty) }}
              <div v-if="item.discount" class="text-[10px] line-through text-slate-500">
                {{ settings.money(item.price * item.qty) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="my-2.5 border-t border-dashed border-slate-400" />

      <div class="space-y-0.5">
        <div class="flex justify-between"><span>{{ t('common.subtotal') }}</span><span>{{ settings.money(order.subtotal) }}</span></div>
        <template v-if="order.discount > 0">
          <div class="flex justify-between">
            <span>{{ t('common.discount') }}</span><span>−{{ settings.money(order.discount) }}</span>
          </div>
          <div
            v-for="applied in order.appliedDiscounts || []"
            :key="applied.id"
            class="flex justify-between text-[10px] pl-2 text-slate-500"
          >
            <span class="truncate pr-2">{{ applied.name }}</span>
            <span>−{{ settings.money(applied.amount) }}</span>
          </div>
        </template>
        <div class="flex justify-between">
          <span>{{ t('common.tax') }} ({{ settings.taxRate }}%)</span><span>{{ settings.money(order.tax) }}</span>
        </div>
        <div class="flex justify-between font-bold text-[14px] pt-1.5 mt-1.5 border-t border-slate-400">
          <span>TOTAL</span><span>{{ settings.money(order.total) }}</span>
        </div>
        <div class="flex justify-between"><span>{{ t('pos.paid') }}</span><span>{{ settings.money(order.paid) }}</span></div>
        <div class="flex justify-between"><span>{{ t('pos.change') }}</span><span>{{ settings.money(order.change) }}</span></div>
      </div>

      <div class="my-2.5 border-t border-dashed border-slate-400" />

      <!-- codes -->
      <div class="flex flex-col items-center gap-2">
        <Barcode :value="barcodeValue" :height="42" />
        <QrCode :value="verifyPayload" :size="92" light="#ffffff" />
        <p class="text-[10px] text-slate-500">Scan to verify this transaction</p>
      </div>

      <div class="my-2.5 border-t border-dashed border-slate-400" />

      <p class="text-center">{{ settings.receiptFooter }}</p>
      <p class="text-center text-[10px] text-slate-500 mt-1">
        Powered by NovaPOS · {{ new Date().getFullYear() }}
      </p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button variant="secondary" block icon="download" @click="emit('download')">
          {{ t('common.download') }}
        </Button>
        <Button block icon="print" @click="print">{{ t('common.print') }}</Button>
      </div>
    </template>
  </Modal>
</template>
