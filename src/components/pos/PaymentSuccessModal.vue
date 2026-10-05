<script setup>
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useSettingsStore } from '@/stores/settings'

defineProps({
  open: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['close', 'print', 'download', 'new-sale'])
const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template>
  <Modal :open="open" :title="t('pos.payment')" size="max-w-md" @close="emit('new-sale')">
    <div v-if="order" class="text-center">
      <div class="relative mx-auto w-20 h-20">
        <span class="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
        <span
          class="relative w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 flex items-center justify-center"
        >
          <Icon name="check" size="w-10 h-10" stroke-width="2.5" />
        </span>
      </div>

      <h3 class="mt-4 text-xl font-bold text-slate-900 dark:text-white">{{ t('pos.success') }}</h3>
      <p class="text-sm text-slate-500 mt-1">{{ t('pos.successHint', { id: order.id }) }}</p>

      <p class="mt-5 text-4xl font-bold text-brand-600">
        <AnimatedNumber :value="order.total" currency />
      </p>

      <dl class="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2 text-sm text-left">
        <div class="flex justify-between">
          <dt class="text-slate-500">{{ t('pos.orderNumber') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ order.id }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">{{ t('pos.paymentMethod') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ order.method }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">{{ t('pos.paid') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ settings.money(order.paid) }}</dd>
        </div>
        <div class="flex justify-between pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
          <dt class="text-slate-500">{{ t('pos.change') }}</dt>
          <dd class="font-bold text-emerald-600">{{ settings.money(order.change) }}</dd>
        </div>
      </dl>

      <div class="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" icon="print" @click="emit('print')">{{ t('common.print') }}</Button>
        <Button variant="secondary" icon="download" @click="emit('download')">{{ t('common.download') }}</Button>
      </div>
      <Button block size="lg" icon="plus" class="mt-2" @click="emit('new-sale')">{{ t('pos.newSale') }}</Button>
    </div>
  </Modal>
</template>
