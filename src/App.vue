<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Sidebar from '@/components/layout/Sidebar.vue'
import MobileTabBar from '@/components/layout/MobileTabBar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import RouteProgress from '@/components/ui/RouteProgress.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import GlobalLoader from '@/components/ui/GlobalLoader.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useLoadingStore } from '@/stores/loading'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const cart = useCartStore()
const loading = useLoadingStore()
const { t } = useI18n()

const blankLayout = computed(() => route.meta.layout === 'blank')
/** POS runs full-screen so the cashier sees nothing but products + cart. */
const kioskLayout = computed(() => route.meta.layout === 'kiosk')
const densePadding = computed(() => route.meta.dense)

const logout = () => {
  auth.logout()
  cart.clear()
  ui.closeMobileSidebar()
  ui.notify(t('auth.signOut'))
  router.push('/login')
}
</script>

<template>
  <div class="h-full">
    <RouterView v-if="blankLayout" />

    <!-- Full-screen POS (kiosk) — chrome removed, own back button -->
    <div v-else-if="kioskLayout" class="h-dvh overflow-hidden bg-canvas animate-kiosk">
      <RouterView />
    </div>

    <div v-else class="h-full flex bg-canvas">
      <Sidebar @logout="logout" />

      <div class="grow flex flex-col min-w-0">
        <Navbar @logout="logout" />

        <main
          class="grow overflow-y-auto overflow-x-hidden pb-[76px] lg:pb-0"
          :class="densePadding ? 'p-2.5 sm:p-4' : 'p-3 sm:p-5 lg:p-6'"
        >
          <RouterView v-slot="{ Component }">
            <!-- Suspense gives every lazy route a clean centered loader -->
            <Transition name="page" mode="out-in">
              <Suspense timeout="0">
                <component :is="Component" />
                <template #fallback>
                  <LoadingState brand-mark title="Loading" min-height="65vh" />
                </template>
              </Suspense>
            </Transition>
          </RouterView>
        </main>
      </div>

      <MobileTabBar @logout="logout" />
    </div>

    <!-- Global blocking loader (centered) — opt-in via loading.block() -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <LoadingState
          v-if="loading.blocking"
          variant="screen"
          brand-mark
          :title="loading.blockingMessage || 'Working…'"
          description="This will only take a moment."
        />
      </Transition>
    </Teleport>

    <RouteProgress />
    <GlobalLoader />
    <ToastHost />
  </div>
</template>
