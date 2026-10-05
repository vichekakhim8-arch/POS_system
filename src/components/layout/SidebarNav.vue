<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { navigation } from './navigation'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})

const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const { t } = useI18n()

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)

/** Hide links the current role cannot access (never show dead buttons). */
const visibleLinks = (group) => group.links.filter((l) => !l.ability || auth.can(l.ability))
const groupActive = (group) => visibleLinks(group).some((l) => isActive(l.to))

const openGroups = ref(
  navigation.reduce((acc, group) => {
    acc[group.id] = groupActive(group) || group.id === 'main'
    return acc
  }, {})
)

const toggle = (group) => {
  if (props.collapsed) return
  openGroups.value[group.id] = !openGroups.value[group.id]
}

const isOpen = (group) => props.collapsed || openGroups.value[group.id]

watch(
  () => route.path,
  () => {
    navigation.forEach((group) => {
      if (groupActive(group)) openGroups.value[group.id] = true
    })
  }
)

const groups = computed(() => navigation.filter((g) => visibleLinks(g).length))
</script>

<template>
  <nav class="grow overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1.5">
    <div v-for="group in groups" :key="group.id">
      <!-- Group header -->
      <button
        v-if="!collapsed"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition"
        :class="
          groupActive(group)
            ? 'text-brand-600 dark:text-brand-400'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        "
        @click="toggle(group)"
      >
        <span class="grow text-left truncate">{{ t(group.labelKey) }}</span>
        <Icon
          name="chevronRight"
          size="w-3.5 h-3.5"
          class="transition-transform duration-300"
          :class="isOpen(group) ? 'rotate-90' : ''"
        />
      </button>

      <div v-else class="my-2 mx-3 h-px bg-slate-200 dark:bg-slate-800" />

      <!-- Links -->
      <div
        class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        :style="{ gridTemplateRows: isOpen(group) ? '1fr' : '0fr', opacity: isOpen(group) ? 1 : 0 }"
      >
        <div class="overflow-hidden">
          <div class="space-y-1 pt-0.5">
            <RouterLink
              v-for="link in visibleLinks(group)"
              :key="link.to"
              :to="link.to"
              :title="t(link.labelKey)"
              class="group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-medium
                     transition-colors duration-150 focus:outline-none
                     focus-visible:ring-2 focus-visible:ring-brand-500/40"
              :class="[
                isActive(link.to)
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                collapsed ? 'justify-center px-0' : ''
              ]"
              :style="
                isActive(link.to)
                  ? { background: 'color-mix(in srgb, var(--c-primary) 11%, transparent)' }
                  : {}
              "
            >
              <!-- subtle premium active rail -->
              <span
                v-if="isActive(link.to) && !collapsed"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                :style="{ background: 'var(--c-primary)' }"
              />
              <span
                v-else-if="!isActive(link.to) && !collapsed"
                class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                :style="{ background: 'var(--c-field-fill)' }"
              />

              <Icon :name="link.icon" size="w-[18px] h-[18px] shrink-0 relative" />

              <template v-if="!collapsed">
                <span class="truncate relative">{{ t(link.labelKey) }}</span>
                <span
                  v-if="link.badge === 'cart' && cart.count"
                  class="relative ml-auto min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full
                         text-[10px] font-bold tabular-nums text-white"
                  :style="{ background: 'var(--c-primary)' }"
                >
                  {{ cart.count }}
                </span>
              </template>
              <span
                v-else-if="link.badge === 'cart' && cart.count"
                class="absolute top-1 right-2.5 w-2 h-2 rounded-full ring-2"
                :style="{ background: 'var(--c-primary)', '--tw-ring-color': 'var(--c-sidebar)' }"
              />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
