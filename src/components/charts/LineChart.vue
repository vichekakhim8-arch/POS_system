<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  height: { type: Number, default: 240 },
  color: { type: String, default: 'var(--c-primary, #4f46e5)' },
  formatter: { type: Function, default: (v) => v }
})

const W = 720
const PAD_L = 52 // room for Y-axis money labels
const PAD_R = 16
const PAD_T = 14
const PAD_B = 28
const PAD = PAD_L // kept for the legacy grid helpers below

const hover = ref(null)
const mounted = ref(false)

const plotW = computed(() => W - PAD_L - PAD_R)
const plotH = computed(() => props.height - PAD_T - PAD_B)

/** Friendly axis ceiling (1/2/5 × 10ⁿ) so tick labels stay readable. */
const niceMax = computed(() => {
  const raw = Math.max(...props.data, 1)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
})

const max = computed(() => niceMax.value)

const ticks = computed(() =>
  [1, 0.75, 0.5, 0.25, 0].map((fraction) => ({
    value: niceMax.value * fraction,
    y: PAD_T + (1 - fraction) * plotH.value
  }))
)

const points = computed(() =>
  props.data.map((value, i) => [
    PAD_L + (i * plotW.value) / Math.max(props.data.length - 1, 1),
    PAD_T + plotH.value - (value / max.value) * plotH.value
  ])
)

const line = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
)

const area = computed(() => {
  if (!points.value.length) return ''
  const baseline = PAD_T + plotH.value
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${line.value} L${last[0].toFixed(1)} ${baseline} L${first[0].toFixed(1)} ${baseline} Z`
})

const uid = Math.random().toString(36).slice(2, 8)

const step = computed(() => Math.max(1, Math.ceil(props.labels.length / 8)))

onMounted(() => requestAnimationFrame(() => (mounted.value = true)))
watch(() => props.data, () => {
  mounted.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (mounted.value = true)))
})
</script>

<template>
  <div class="relative">
    <svg
      :viewBox="`0 0 ${W} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      class="w-full block overflow-visible"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="`Line chart with ${data.length} data points`"
      @mouseleave="hover = null"
    >
      <defs>
        <linearGradient :id="`fill-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- gridlines + Y-axis values -->
      <g v-for="tick in ticks" :key="`t-${tick.y}`">
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
          {{ formatter(tick.value) }}
        </text>
      </g>

      <path
        :d="area"
        :fill="`url(#fill-${uid})`"
        class="transition-opacity duration-700"
        :style="{ opacity: mounted ? 1 : 0 }"
      />
      <path
        :d="line"
        fill="none"
        :stroke="color"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="1"
        :stroke-dashoffset="mounted ? 0 : 1"
        style="transition: stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)"
      />

      <g v-for="(p, i) in points" :key="`p-${i}`">
        <circle
          :cx="p[0]"
          :cy="p[1]"
          :r="hover === i ? 6 : 3.5"
          fill="#fff"
          :stroke="color"
          stroke-width="2"
          class="transition-all duration-150"
          :style="{ opacity: mounted ? 1 : 0, transitionDelay: `${i * 25}ms` }"
        />
        <rect
          :x="p[0] - 14"
          y="0"
          width="28"
          :height="height"
          fill="transparent"
          @mouseenter="hover = i"
          @mouseleave="hover = null"
        />
      </g>

      <text
        v-for="(label, i) in labels"
        :key="`l-${i}`"
        v-show="i % step === 0 || i === labels.length - 1"
        :x="points[i] ? points[i][0] : 0"
        :y="height - 8"
        text-anchor="middle"
        font-size="10.5"
        fill="currentColor"
        fill-opacity="0.5"
      >
        {{ label }}
      </text>
    </svg>

    <Transition enter-active-class="transition duration-120 ease-out" enter-from-class="opacity-0 translate-y-1">
      <div
        v-if="hover !== null && points[hover]"
        class="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-xl text-white shadow-lg whitespace-nowrap"
        :style="{
          left: `${(points[hover][0] / W) * 100}%`,
          top: `${points[hover][1]}px`,
          transform: `translate(${
            (points[hover][0] / W) * 100 > 82 ? '-92%' : (points[hover][0] / W) * 100 < 10 ? '-8%' : '-50%'
          }, calc(-100% - 10px))`,
          background: 'rgb(15 23 42 / 0.94)'
        }"
      >
        <p class="text-[13px] font-bold tabular-nums leading-none">{{ formatter(data[hover]) }}</p>
        <p class="text-[10.5px] opacity-65 mt-1 leading-none">{{ labels[hover] }}</p>
      </div>
    </Transition>
  </div>
</template>
