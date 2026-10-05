<script setup>
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  icon: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  step: { type: [String, Number], default: null },
  min: { type: [String, Number], default: null },
  max: { type: [String, Number], default: null },
  maxlength: { type: [String, Number], default: null },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  rows: { type: Number, default: 0 },
  size: { type: String, default: 'md' },
  suffixText: { type: String, default: '' },
  autocomplete: { type: String, default: null },
  inputmode: { type: String, default: null }
})

defineEmits(['update:modelValue', 'enter', 'blur'])

const revealed = ref(false)
const uid = `in-${Math.random().toString(36).slice(2, 8)}`

const isPassword = computed(() => props.type === 'password')
const resolvedType = computed(() =>
  isPassword.value ? (revealed.value ? 'text' : 'password') : props.type
)

const heights = { sm: 'h-9 text-[13px]', md: 'h-11', lg: 'h-12 text-[15px]' }
</script>

<template>
  <div>
    <label v-if="label" :for="uid" class="label">
      {{ label }}
      <span v-if="required" class="text-rose-500" aria-hidden="true">*</span>
    </label>

    <div class="input-group">
      <Icon v-if="icon && rows === 0" :name="icon" size="w-4 h-4" class="input-icon" />

      <textarea
        v-if="rows > 0"
        :id="uid"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="field resize-none"
        :class="error ? 'field-error' : ''"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />

      <input
        v-else
        :id="uid"
        :value="modelValue"
        :type="resolvedType"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :step="step"
        :min="min"
        :max="max"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        class="field"
        :class="[
          heights[size] || heights.md,
          icon ? 'pl-10' : '',
          isPassword || suffixText ? 'pr-11' : '',
          error ? 'field-error' : ''
        ]"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${uid}-msg` : undefined"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="$emit('enter')"
        @blur="$emit('blur')"
      />

      <!-- password reveal: active state is reflected in colour + icon -->
      <button
        v-if="isPassword"
        type="button"
        class="input-action"
        :class="revealed ? 'is-active' : ''"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        tabindex="-1"
        @click="revealed = !revealed"
      >
        <Icon :name="revealed ? 'eyeOff' : 'eye'" size="w-[18px] h-[18px]" />
      </button>

      <span
        v-else-if="suffixText"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none"
      >
        {{ suffixText }}
      </span>

      <slot name="suffix" />
    </div>

    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0 -translate-y-0.5"
    >
      <p
        v-if="error"
        :id="`${uid}-msg`"
        class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"
      >
        <Icon name="alert" size="w-3.5 h-3.5" class="shrink-0" />
        {{ error }}
      </p>
      <p v-else-if="hint" :id="`${uid}-msg`" class="mt-1.5 text-xs text-slate-400">{{ hint }}</p>
    </Transition>
  </div>
</template>
