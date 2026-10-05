<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

/**
 * Select primitive. Heights mirror Button/Input exactly
 * (sm 36 · md 44 · lg 48) so any toolbar row aligns on one baseline.
 */
const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // ['A'] or [{ value, label }]
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  icon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  size: { type: String, default: 'md' }
})

defineEmits(['update:modelValue'])

const uid = `sel-${Math.random().toString(36).slice(2, 8)}`
const heights = { sm: 'h-9 text-[13px]', md: 'h-11 text-sm', lg: 'h-12 text-[15px]' }

const normalize = (option) =>
  typeof option === 'object' && option !== null
    ? { value: option.value, label: option.label }
    : { value: option, label: option }

const height = computed(() => heights[props.size] || heights.md)
</script>

<template>
  <div>
    <label v-if="label" :for="uid" class="label">
      {{ label }}
      <span v-if="required" class="text-rose-500" aria-hidden="true">*</span>
    </label>

    <div class="input-group">
      <Icon v-if="icon" :name="icon" size="w-4 h-4" class="input-icon" />

      <select
        :id="uid"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="field appearance-none cursor-pointer pr-10"
        :class="[height, icon ? 'pl-10' : '', error ? 'field-error' : '']"
        :aria-invalid="!!error"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="normalize(option).value"
          :value="normalize(option).value"
        >
          {{ normalize(option).label }}
        </option>
      </select>

      <Icon
        name="chevronRight"
        size="w-4 h-4"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"
      />
    </div>

    <p v-if="error" class="mt-1.5 t-caption font-medium text-rose-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 t-caption text-slate-400">{{ hint }}</p>
  </div>
</template>
