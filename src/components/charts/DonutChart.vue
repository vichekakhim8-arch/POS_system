<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { CHART_COLORS } from '@/utils/helpers'

const props = defineProps({
  // [{ label, value, color }]
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 164 },
  thickness: { type: Number, default: 22 },
  formatter: { type: Function, default: null }
})

const R = 60
const CIRC = 2 * Math.PI * R

const mounted = ref(false)
const hover = ref(null)

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0) || 1)

const segments = computed(() => {
  let acc = 0
  return props.data.map((d, i) => {
    const fraction = d.value / total.value
    const segment = {
      ...d,
      color: d.color || CHART_COLORS[i % CHART_COLORS.length],
      length: fraction * CIRC,
      offset: -acc * CIRC,
      percent: (fraction * 100).toFixed(0),
      index: i
    }
    acc += fraction
    return segment
  })
})

const activeLabel = computed(() =>
  hover.value !== null ? segments.value[hover.value] : null
)

const replay = () => {
  mounted.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (mounted.value = true)))
}

onMounted(replay)
watch(() => props.data, replay, { deep: true })
</script>

<template>
  <div class="flex items-center gap-5 flex-wrap sm:flex-nowrap">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg viewBox="0 0 160 160" class="w-full h-full -rotate-90">
        <!-- track -->
        <circle
          cx="80"
          cy="80"
          :r="R"
          fill="none"
          stroke="currentColor"
          stroke-opacity="0.07"
          :stroke-width="thickness"
          class="text-slate-400"
        />
        <!-- animated segments: each sweeps in from zero length -->
        <circle
          v-for="s in segments"
          :key="s.label"
          cx="80"
          cy="80"
          :r="R"
          fill="none"
          :stroke="s.color"
          :stroke-width="hover === s.index ? thickness + 4 : thickness"
          stroke-linecap="butt"
          :stroke-dasharray="`${mounted ? s.length.toFixed(2) : 0} ${CIRC.toFixed(2)}`"
          :stroke-dashoffset="s.offset.toFixed(2)"
          :opacity="hover === null || hover === s.index ? 1 : 0.35"
          class="cursor-pointer"
          :style="{
            transition: `stroke-dasharray .85s cubic-bezier(.22,1,.36,1) ${s.index * 110}ms,
                         stroke-width .18s ease, opacity .18s ease`
          }"
          @mouseenter="hover = s.index"
          @mouseleave="hover = null"
        />
      </svg>

      <!-- center readout -->
      <div class="absolute inset-0 grid place-items-center pointer-events-none text-center px-6">
        <Transition name="fade" mode="out-in">
          <div :key="activeLabel ? activeLabel.label : 'total'">
            <p class="text-[19px] font-bold text-slate-900 dark:text-white leading-none tabular-nums">
              {{ activeLabel ? `${activeLabel.percent}%` : segments.length }}
            </p>
            <p class="text-[10px] text-slate-400 mt-1 truncate max-w-[88px]">
              {{ activeLabel ? activeLabel.label : 'categories' }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <ul class="space-y-2 text-sm grow min-w-[130px]">
      <li
        v-for="s in segments"
        :key="`l-${s.label}`"
        class="flex items-center gap-2.5 cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
        :class="hover === s.index ? 'bg-slate-100 dark:bg-slate-800' : ''"
        @mouseenter="hover = s.index"
        @mouseleave="hover = null"
      >
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: s.color }" />
        <span class="text-slate-600 dark:text-slate-300 truncate grow">{{ s.label }}</span>
        <span class="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0">
          {{ formatter ? formatter(s.value) : `${s.percent}%` }}
        </span>
      </li>
      <li v-if="!segments.length" class="text-slate-400 text-sm">No data for this period.</li>
    </ul>
  </div>
</template>
