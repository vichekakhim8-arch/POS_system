<script setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { hexToRgb, normalizeHex } from '@/stores/theme'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '#000000' },
  hint: { type: String, default: '' },
  resettable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'reset'])

const draft = ref(props.modelValue)
const invalid = ref(false)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value
    invalid.value = false
  }
)

const rgb = computed(() => {
  const { r, g, b } = hexToRgb(props.modelValue)
  return `${r}, ${g}, ${b}`
})

const commit = (value) => {
  const hex = normalizeHex(value)
  if (!hex) {
    invalid.value = true
    return
  }
  invalid.value = false
  draft.value = hex
  emit('update:modelValue', hex)
}
</script>

<template>
  <div class="flex items-center gap-3 py-2.5">
    <!-- swatch + native picker -->
    <label
      class="relative w-10 h-10 shrink-0 rounded-xl border border-line overflow-hidden cursor-pointer transition hover:scale-105"
      :style="{ background: modelValue }"
      :title="label"
    >
      <input
        type="color"
        class="absolute inset-0 opacity-0 cursor-pointer"
        :value="normalizeHex(modelValue) || '#000000'"
        @input="commit($event.target.value)"
      />
    </label>

    <div class="min-w-0 grow">
      <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ label }}</p>
      <p class="text-[11px] text-slate-400 truncate">
        {{ hint || `rgb(${rgb})` }}
      </p>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <input
        v-model="draft"
        class="field w-[104px] py-1.5 text-xs font-mono uppercase text-center"
        :class="invalid ? 'border-rose-400' : ''"
        maxlength="7"
        spellcheck="false"
        @change="commit(draft)"
        @keyup.enter="commit(draft)"
        @blur="commit(draft)"
      />
      <button
        v-if="resettable"
        class="icon-btn"
        title="Reset to default"
        @click="$emit('reset')"
      >
        <Icon name="refresh" size="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
