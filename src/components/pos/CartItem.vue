<script setup>
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import Icon from '@/components/ui/Icon.vue'

/** `line` is pre-calculated by the cart store (shared discount engine). */
defineProps({
  line: { type: Object, required: true }
})

defineEmits(['increase', 'decrease', 'remove', 'discount'])

const settings = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <article
    class="group relative rounded-2xl bg-white dark:bg-slate-900 p-2.5
           ring-1 ring-slate-200/80 dark:ring-slate-800
           shadow-[0_1px_2px_rgb(16_24_40/0.04)]
           hover:ring-slate-300 dark:hover:ring-slate-700 transition-all duration-200"
  >
    <div class="flex gap-3">
      <!-- thumbnail -->
      <div class="relative shrink-0">
        <img
          :src="line.image"
          :alt="line.name"
          class="w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
        />
        <span
          class="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 grid place-items-center rounded-full
                 text-[10px] font-bold text-white tabular-nums ring-2 ring-white dark:ring-slate-900"
          :style="{ background: 'var(--c-primary)' }"
        >
          {{ line.qty }}
        </span>
      </div>

      <div class="min-w-0 grow">
        <!-- title + remove -->
        <div class="flex items-start justify-between gap-2">
          <p class="text-[13.5px] font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1">
            {{ line.name }}
          </p>
          <button data-no-loader
            type="button"
            class="shrink-0 -mt-0.5 -mr-0.5 w-6 h-6 grid place-items-center rounded-lg text-slate-300
                   opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                   hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
            :aria-label="`Remove ${line.name}`"
            @click="$emit('remove', line.key)"
          >
            <Icon name="x" size="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- unit price -->
        <div class="flex items-center gap-1.5 mt-0.5">
          <template v-if="line.unitDiscount > 0">
            <span class="text-[11px] line-through text-slate-400">
              {{ settings.money(line.unitPrice) }}
            </span>
            <span class="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              {{ settings.money(line.finalPrice) }}
            </span>
          </template>
          <span v-else class="text-[12px] text-slate-500">{{ settings.money(line.unitPrice) }}</span>
          <span class="text-[11px] text-slate-400">{{ t('pos.each') }}</span>
        </div>

        <!-- discount tag -->
        <div v-if="line.discountName" class="mt-1.5">
          <span
            class="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md text-[10px] font-bold"
            :style="{
              background: 'color-mix(in srgb, var(--pos-discount) 12%, transparent)',
              color: 'var(--pos-discount)'
            }"
          >
            <Icon name="tag" size="w-2.5 h-2.5" />
            {{ line.discountName }}
            <span v-if="line.percentOff">· −{{ line.percentOff }}%</span>
          </span>
        </div>
      </div>
    </div>

    <!-- controls + line total -->
    <div class="flex items-center justify-between gap-2 mt-2.5 pl-[68px]">
      <div
        class="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5"
        role="group"
        :aria-label="`Quantity for ${line.name}`"
      >
        <button data-no-loader
          type="button"
          class="w-7 h-7 grid place-items-center rounded-lg text-slate-600 dark:text-slate-300
                 hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 hover:shadow-sm
                 active:scale-90 transition"
          aria-label="Decrease quantity"
          @click="$emit('decrease', line.key)"
        >
          <Icon name="minus" size="w-3.5 h-3.5" stroke-width="2.5" />
        </button>
        <span class="w-8 text-center text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
          {{ line.qty }}
        </span>
        <button data-no-loader
          type="button"
          class="w-7 h-7 grid place-items-center rounded-lg text-slate-600 dark:text-slate-300
                 hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 hover:shadow-sm
                 active:scale-90 transition"
          aria-label="Increase quantity"
          @click="$emit('increase', line.key)"
        >
          <Icon name="plus" size="w-3.5 h-3.5" stroke-width="2.5" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="w-7 h-7 grid place-items-center rounded-lg text-slate-400
                 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition"
          title="Apply item discount"
          aria-label="Apply item discount"
          @click="$emit('discount', line)"
        >
          <Icon name="tag" size="w-3.5 h-3.5" />
        </button>

        <div class="text-right">
          <p class="text-[14px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
            {{ settings.money(line.lineTotal) }}
          </p>
          <p
            v-if="line.lineDiscount > 0"
            class="text-[10px] font-semibold tabular-nums mt-0.5"
            :style="{ color: 'var(--pos-discount)' }"
          >
            {{ t('pos.savedLabel') }} {{ settings.money(line.lineDiscount) }}
          </p>
        </div>
      </div>
    </div>
  </article>
</template>
