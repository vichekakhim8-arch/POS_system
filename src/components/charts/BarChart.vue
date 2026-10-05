<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  height: { type: Number, default: 240 },
  color: { type: String, default: 'var(--c-primary, #4f46e5)' },
  formatter: { type: Function, default: (v) => v },
  /** Shown in the tooltip, e.g. "orders" */
  unit: { type: String, default: '' },
  showYAxis: { type: Boolean, default: true }
})

const W = 720
const PAD_L = 44 // room for Y-axis numbers
const PAD_R = 16
const PAD_T = 14
const PAD_B = 28

const hover = ref(null)
const mounted = ref(false)

const plotW = computed(() => W - PAD_L - PAD_R)
const plotH = computed(() => props.height - PAD_T - PAD_B)

/** Round the axis maximum up to a friendly step (1/2/5 × 10ⁿ). */
const niceMax = computed(() => {
  const raw = Math.max(...props.data, 1)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
})

/** 5 evenly spaced ticks, top → bottom. */
const ticks = computed(() =>
  [1, 0.75, 0.5, 0.25, 0].map((fraction) => ({
    value: Math.round(niceMax.value * fraction),
    y: PAD_T + (1 - fraction) * plotH.value
  }))
)

const bars = computed(() => {
  const gap = plotW.value / Math.max(props.data.length, 1)
  const width = Math.min(gap * 0.6, 42)
  return props.data.map((value, i) => {
    const h = (value / niceMax.value) * plotH.value
    return {
      x: PAD_L + i * gap + (gap - width) / 2,
      y: PAD_T + plotH.value - h,
      w: width,
      h: Math.max(h, value > 0 ? 3 : 0),
      cx: PAD_L + i * gap + gap / 2,
      band: { x: PAD_L + i * gap, w: gap },
      value,
      label: props.labels[i] ?? '',
      index: i
    }
  })
})

/** Thin the X labels so they never collide. */
const labelStep = computed(() => Math.max(1, Math.ceil(props.labels.length / 12)))

const active = computed(() => (hover.value === null ? null : bars.value[hover.value]))

/** Flip the tooltip near the right edge so it stays inside the card. */
const tooltipStyle = computed(() => {
  if (!active.value) return {}
  const pct = (active.value.cx / W) * 100
  return {
    left: `${pct}%`,
    top: `${active.value.y}px`,
    transform: `translate(${pct > 82 ? '-92%' : pct < 10 ? '-8%' : '-50%'}, calc(-100% - 10px))`
  }
})

const replay = () => {
  mounted.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (mounted.value = true)))
}

onMounted(replay)
watch(() => props.data, replay, { deep: true })
</script>

<template>
  <div class="relative">
    <svg
      :viewBox="`0 0 ${W} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      class="w-full block overflow-visible"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="`Bar chart, ${data.length} points, maximum ${niceMax}`"
      @mouseleave="hover = null"
    >
      <!-- gridlines + Y-axis values -->
      <g v-if="showYAxis">
        <g v-for="tick in ticks" :key="`t-${tick.value}-${tick.y}`">
          <line
            :x1="PAD_L"
            :x2="W - PAD_R"
            :y1="tick.y"
            :y2="tick.y"
            stroke="currentColor"
            stroke-opacity="0.1"
            stroke-dasharray="4 6"
            class="text-slate-400"
          />
          <text
            :x="PAD_L - 10"
            :y="tick.y + 3.5"
            text-anchor="end"
            font-size="10.5"
            fill="currentColor"
            fill-opacity="0.45"
            class="tabular-nums"
          >
            {{ tick.value }}
          </text>
        </g>
      </g>

      <!-- bars -->
      <g v-for="bar in bars" :key="`b-${bar.index}`">
        <!-- full-height hover band = forgiving target -->
        <rect
          :x="bar.band.x"
          :y="PAD_T"
          :width="bar.band.w"
          :height="plotH"
          fill="transparent"
          class="cursor-pointer"
          @mouseenter="hover = bar.index"
        />
        <rect
          v-if="hover === bar.index"
          :x="bar.band.x + 1"
          :y="PAD_T"
          :width="bar.band.w - 2"
          :height="plotH"
          rx="6"
          :fill="color"
          opacity="0.07"
          class="pointer-events-none"
        />
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="bar.w"
          :height="bar.h"
          rx="6"
          :fill="color"
          :opacity="hover === null || hover === bar.index ? 0.95 : 0.4"
          class="pointer-events-none"
          :style="{
            transformOrigin: `center ${PAD_T + plotH}px`,
            transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
            transition: `transform .55s cubic-bezier(.22,1,.36,1) ${bar.index * 30}ms, opacity .15s`
          }"
        />
      </g>

      <!-- X labels -->
      <text
        v-for="bar in bars"
        :key="`l-${bar.index}`"
        v-show="bar.index % labelStep === 0 || bar.index === bars.length - 1"
        :x="bar.cx"
        :y="height - 8"
        text-anchor="middle"
        font-size="10.5"
        fill="currentColor"
        :fill-opacity="hover === bar.index ? 0.9 : 0.45"
        class="pointer-events-none"
      >
        {{ bar.label }}
      </text>
    </svg>

    <!-- tooltip -->
    <Transition
      enter-active-class="transition duration-120 ease-out"
      enter-from-class="opacity-0 translate-y-1"
    >
      <div
        v-if="active"
        class="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-xl text-white shadow-lg whitespace-nowrap"
        :style="[tooltipStyle, { background: 'rgb(15 23 42 / 0.94)' }]"
      >
        <p class="text-[13px] font-bold tabular-nums leading-none">
          {{ formatter(active.value) }}
          <span v-if="unit" class="font-medium opacity-70">{{ unit }}</span>
        </p>
        <p class="text-[10.5px] opacity-65 mt-1 leading-none">{{ active.label }}</p>
      </div>
    </Transition>
  </div>
</template>
