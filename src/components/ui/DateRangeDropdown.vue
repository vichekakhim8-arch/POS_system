<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from './Dropdown.vue'
import Icon from './Icon.vue'
import { rangeGroups, resolveRange } from '@/utils/dateRanges'

const props = defineProps({
  modelValue: { type: String, default: 'last30' },
  from: { type: String, default: '' },
  to: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()
const dropdown = ref(null)
const customFrom = ref(props.from)
const customTo = ref(props.to)

const activeLabel = computed(() => {
  const found = rangeGroups.flat().find((r) => r.key === props.modelValue)
  if (props.modelValue === 'custom' && customFrom.value && customTo.value)
    return `${customFrom.value} → ${customTo.value}`
  return found ? t(found.labelKey) : t('date.quickRange')
})

const pick = (key) => {
  emit('update:modelValue', key)
  if (key !== 'custom') {
    const range = resolveRange(key)
    emit('change', { key, ...range })
    dropdown.value?.close()
  }
}

const applyCustom = () => {
  if (!customFrom.value || !customTo.value) return
  emit('update:modelValue', 'custom')
  emit('change', { key: 'custom', from: customFrom.value, to: customTo.value })
  dropdown.value?.close()
}

watch(
  () => [props.from, props.to],
  ([f, s]) => {
    customFrom.value = f
    customTo.value = s
  }
)
</script>

<template>
  <Dropdown ref="dropdown" icon="calendar" width="w-72" align="right">
    <template #trigger>
      <span class="truncate max-w-[180px]">{{ activeLabel }}</span>
    </template>

    <template v-for="(group, gi) in rangeGroups" :key="gi">
      <div v-if="gi" class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
      <button
        v-for="preset in group"
        :key="preset.key"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition"
        :class="
          modelValue === preset.key
            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        "
        @click.stop="pick(preset.key)"
      >
        <span class="grow">{{ t(preset.labelKey) }}</span>
        <Icon v-if="modelValue === preset.key" name="check" size="w-4 h-4" />
      </button>
    </template>

    <div v-if="modelValue === 'custom'" class="p-2 space-y-2" @click.stop>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="label">{{ t('date.from') }}</span>
          <input v-model="customFrom" type="date" class="field py-2" />
        </div>
        <div>
          <span class="label">{{ t('date.to') }}</span>
          <input v-model="customTo" type="date" class="field py-2" />
        </div>
      </div>
      <button
        type="button"
        class="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 transition"
        @click="applyCustom"
      >
        {{ t('date.apply') }}
      </button>
    </div>
  </Dropdown>
</template>
