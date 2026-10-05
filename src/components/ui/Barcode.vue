<script setup>
import { onMounted, ref, watch } from 'vue'
import JsBarcode from 'jsbarcode'

const props = defineProps({
  value: { type: String, required: true },
  format: { type: String, default: 'CODE128' },
  height: { type: Number, default: 46 },
  width: { type: Number, default: 1.6 },
  displayValue: { type: Boolean, default: true },
  fontSize: { type: Number, default: 12 }
})

const svg = ref(null)

const render = () => {
  if (!svg.value || !props.value) return
  try {
    JsBarcode(svg.value, props.value, {
      format: props.format,
      height: props.height,
      width: props.width,
      displayValue: props.displayValue,
      fontSize: props.fontSize,
      font: 'monospace',
      margin: 0,
      lineColor: '#000000',
      background: 'transparent'
    })
  } catch {
    /* invalid barcode payload — keep the element empty */
  }
}

onMounted(render)
watch(() => [props.value, props.format], render)
</script>

<template>
  <svg ref="svg" class="w-full max-w-[240px]" />
</template>
