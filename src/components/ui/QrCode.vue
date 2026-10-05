<script setup>
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  value: { type: String, required: true },
  size: { type: Number, default: 220 },
  dark: { type: String, default: '#0f172a' },
  light: { type: String, default: '#ffffff' },
  level: { type: String, default: 'M' }
})

const canvas = ref(null)
const error = ref('')

const render = async () => {
  if (!canvas.value || !props.value) return
  try {
    await QRCode.toCanvas(canvas.value, props.value, {
      width: props.size,
      margin: 1,
      errorCorrectionLevel: props.level,
      color: { dark: props.dark, light: props.light }
    })
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

onMounted(render)
watch(() => [props.value, props.size, props.dark], render)
</script>

<template>
  <div class="inline-flex flex-col items-center">
    <canvas ref="canvas" class="rounded-xl" :style="{ width: `${size}px`, height: `${size}px` }" />
    <p v-if="error" class="mt-2 text-xs text-rose-500">{{ error }}</p>
  </div>
</template>
