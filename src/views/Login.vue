<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'
import Input from '@/components/ui/Input.vue'
import Spinner from '@/components/ui/Spinner.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import { landingRouteFor } from '@/router'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const theme = useThemeStore()
const { t } = useI18n()

/** signin | register | forgot | otp | reset */
const mode = ref('signin')
const error = ref('')
const otpSent = ref('')

const form = ref({
  email: 'admin@novapos.io',
  password: 'demo1234',
  name: '',
  store: '',
  confirm: '',
  code: ''
})

/** Every role is signed-in-able so the permission model can be exercised. */
const demoAccounts = [
  { email: 'admin@novapos.io', role: 'Owner' },
  { email: 'manager@novapos.io', role: 'Manager' },
  { email: 'cashier@novapos.io', role: 'Cashier' },
  { email: 'kitchen@novapos.io', role: 'Kitchen' }
]

const heading = computed(
  () =>
    ({
      signin: { title: t('auth.signIn'), sub: t('auth.signInSubtitle') },
      register: { title: t('auth.register'), sub: t('auth.registerSubtitle') },
      forgot: { title: t('auth.forgot'), sub: t('auth.forgotSubtitle') },
      otp: { title: t('auth.otp'), sub: t('auth.otpSubtitle', { email: form.value.email }) },
      reset: { title: t('auth.newPassword'), sub: t('auth.forgotSubtitle') }
    })[mode.value]
)

const cta = computed(
  () =>
    ({
      signin: t('auth.signIn'),
      register: t('auth.register'),
      forgot: t('auth.sendCode'),
      otp: t('auth.verify'),
      reset: t('common.save')
    })[mode.value]
)

const canGoBack = computed(() => ['forgot', 'otp', 'reset'].includes(mode.value))

const go = (next) => {
  error.value = ''
  mode.value = next
}

const submit = async () => {
  error.value = ''
  try {
    if (mode.value === 'signin') {
      const user = await auth.login(form.value.email, form.value.password)
      ui.notify(`${t('auth.signIn')} — ${user.name}`)
      // Land on the first page this role can actually open.
      return router.push(landingRouteFor(auth))
    }
    if (mode.value === 'register') {
      if (form.value.password !== form.value.confirm) throw new Error('Passwords do not match.')
      const user = await auth.register({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        store: form.value.store
      })
      ui.notify(`${t('auth.register')} — ${user.name}`)
      return router.push(landingRouteFor(auth))
    }
    if (mode.value === 'forgot') {
      otpSent.value = await auth.requestOtp(form.value.email)
      ui.notify(`Demo code: ${otpSent.value}`)
      return go('otp')
    }
    if (mode.value === 'otp') {
      await auth.verifyOtp(form.value.code)
      return go('reset')
    }
    if (mode.value === 'reset') {
      if (form.value.password !== form.value.confirm) throw new Error('Passwords do not match.')
      await auth.resetPassword(form.value.password)
      ui.notify('Password updated. Please sign in.')
      return go('signin')
    }
  } catch (e) {
    error.value = e.message
  }
}

const resend = async () => {
  otpSent.value = await auth.requestOtp(form.value.email)
  ui.notify(`Demo code: ${otpSent.value}`)
}
</script>

<template>
  <!--
    min-h-dvh (not h-dvh) so short viewports and the mobile keyboard can
    scroll the page naturally instead of clipping the form.
  -->
  <div class="min-h-dvh flex bg-canvas">
    <!-- ════════ Brand panel ════════ -->
    <aside
      class="hidden lg:flex lg:w-[44%] xl:w-[46%] shrink-0 flex-col justify-between p-10 xl:p-14
             text-white relative overflow-hidden sticky top-0 h-dvh"
      :style="{ background: 'var(--c-primary)' }"
    >
      <div class="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/[0.07]" />
      <div class="absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-black/[0.07]" />

      <div class="relative flex items-center gap-3">
        <span class="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
          <Icon name="store" size="w-[22px] h-[22px]" />
        </span>
        <div>
          <p class="text-[15px] font-bold leading-none">{{ t('app.name') }}</p>
          <p class="text-[11px] text-white/70 mt-1">{{ t('app.tagline') }}</p>
        </div>
      </div>

      <div class="relative max-w-md">
        <h1 class="text-[34px] xl:text-[38px] font-bold leading-[1.18]">{{ t('auth.heroTitle') }}</h1>
        <p class="mt-4 text-[15px] text-white/75 leading-relaxed">{{ t('auth.heroText') }}</p>
        <ul class="mt-7 space-y-2.5">
          <li
            v-for="f in [t('auth.f1'), t('auth.f2'), t('auth.f3'), t('auth.f4')]"
            :key="f"
            class="flex items-center gap-2.5"
          >
            <span class="w-5 h-5 rounded-lg bg-white/15 grid place-items-center shrink-0">
              <Icon name="check" size="w-3 h-3" stroke-width="3" />
            </span>
            <span class="text-[13px] text-white/85">{{ f }}</span>
          </li>
        </ul>
      </div>

      <div class="relative flex items-center gap-7 pt-5">
        <div><p class="text-xl font-bold">12k+</p><p class="text-[11px] text-white/60">Orders / mo</p></div>
        <div><p class="text-xl font-bold">99.9%</p><p class="text-[11px] text-white/60">Uptime</p></div>
        <div><p class="text-xl font-bold">4.9★</p><p class="text-[11px] text-white/60">Rating</p></div>
      </div>
    </aside>

    <!-- ════════ Form panel ════════ -->
    <main class="grow flex flex-col min-w-0">
      <header class="shrink-0 flex items-center gap-3 px-5 sm:px-8 py-4">
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="segmented" />
          <button
            type="button"
            class="w-9 h-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-700
                   text-slate-500 transition hover:text-brand-600 hover:border-brand-400
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            :aria-label="theme.isDark ? 'Light mode' : 'Dark mode'"
            @click="theme.toggleMode()"
          >
            <Icon :name="theme.isDark ? 'sun' : 'moon'" size="w-4 h-4" />
          </button>
        </div>
      </header>

      <div class="grow flex items-center justify-center px-5 sm:px-8 py-6 sm:py-8">
        <div class="w-full max-w-[380px]">
          <!-- back (forgot / otp / reset) -->
          <button
            v-if="canGoBack"
            type="button"
            class="inline-flex items-center gap-1.5 mb-4 text-[13px] font-semibold text-slate-500
                   hover:text-brand-600 transition"
            @click="go('signin')"
          >
            <Icon name="chevronRight" size="w-4 h-4" class="rotate-180" />
            {{ t('auth.signIn') }}
          </button>

          <!-- bordered card with centred logo -->
          <div
            class="card p-5 sm:p-7 animate-rise"
            :style="{ borderRadius: 'var(--radius-2xl)' }"
          >

          <div class="text-center mb-6">
            <span
              class="w-14 h-14 mx-auto mb-4 grid place-items-center text-white rounded-2xl"
              :style="{
                background: 'var(--c-primary)',
                boxShadow: '0 10px 24px -10px color-mix(in srgb, var(--c-primary) 70%, transparent)'
              }"
            >
              <Icon name="store" size="w-7 h-7" />
            </span>
            <h2 class="text-[21px] font-bold text-slate-900 dark:text-white leading-tight">
              {{ heading.title }}
            </h2>
            <p class="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{{ heading.sub }}</p>
          </div>

          <!-- form -->
          <form class="space-y-3.5" @submit.prevent="submit">
            <template v-if="mode === 'register'">
              <Input
                v-model="form.name"
                :label="t('auth.fullName')"
                icon="user"
                size="lg"
                required
                placeholder="Alex Morgan"
              />
              <Input
                v-model="form.store"
                :label="t('auth.storeName')"
                icon="store"
                size="lg"
                required
                placeholder="My Retail Store"
              />
            </template>

            <Input
              v-if="mode !== 'otp'"
              v-model="form.email"
              :label="t('auth.emailLabel')"
              type="email"
              icon="mail"
              size="lg"
              required
              autocomplete="username"
              placeholder="you@store.com"
            />

            <Input
              v-if="['signin', 'register', 'reset'].includes(mode)"
              v-model="form.password"
              :label="mode === 'reset' ? t('auth.newPassword') : t('auth.passwordLabel')"
              type="password"
              icon="lock"
              size="lg"
              required
              autocomplete="current-password"
              placeholder="••••••••"
            />

            <Input
              v-if="['register', 'reset'].includes(mode)"
              v-model="form.confirm"
              :label="t('auth.confirmPassword')"
              type="password"
              icon="lock"
              size="lg"
              required
              placeholder="••••••••"
            />

            <template v-if="mode === 'otp'">
              <div>
                <label class="label" for="otp-code">{{ t('auth.otp') }}</label>
                <input
                  id="otp-code"
                  v-model="form.code"
                  maxlength="6"
                  inputmode="numeric"
                  class="field h-14 text-center text-[22px] font-bold tracking-[0.45em]"
                  placeholder="000000"
                />
                <p v-if="otpSent" class="mt-2 text-xs text-slate-400">
                  Demo code: <b class="text-slate-700 dark:text-slate-200 font-mono">{{ otpSent }}</b>
                </p>
              </div>
              <button type="button" class="text-[13px] font-semibold text-brand-600 hover:underline" @click="resend">
                {{ t('auth.resend') }}
              </button>
            </template>

            <div v-if="mode === 'signin'" class="flex items-center justify-between gap-3 text-[13px] pt-0.5">
              <label class="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked class="w-4 h-4 rounded-md accent-brand-600 border-0" />
                {{ t('auth.rememberMe') }}
              </label>
              <button type="button" class="font-semibold text-brand-600 hover:underline" @click="go('forgot')">
                {{ t('auth.forgotLink') }}
              </button>
            </div>

            <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-1">
              <p
                v-if="error"
                class="flex items-start gap-2 text-[13px] px-3.5 py-3 rounded-2xl"
                :style="{ background: 'color-mix(in srgb, var(--c-danger) 11%, transparent)', color: 'var(--c-danger)' }"
                role="alert"
              >
                <Icon name="alert" size="w-4 h-4" class="shrink-0 mt-px" />
                {{ error }}
              </p>
            </Transition>

            <!-- borderless primary button -->
            <button
              type="submit"
              class="w-full h-12 rounded-2xl border-0 text-[15px] font-semibold text-white
                     inline-flex items-center justify-center gap-2 transition
                     hover:brightness-95 active:scale-[.985] disabled:opacity-60
                     focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
              :style="{ background: 'var(--c-primary)' }"
              :disabled="auth.loading"
            >
              <Spinner v-if="auth.loading" :size="18" :stroke="3" />
              {{ auth.loading ? 'Please wait…' : cta }}
            </button>
          </form>

          <p v-if="!canGoBack" class="mt-5 text-center text-[13px] text-slate-500">
            <template v-if="mode === 'signin'">
              {{ t('auth.noAccount') }}
              <button class="font-semibold text-brand-600 hover:underline" @click="go('register')">
                {{ t('auth.register') }}
              </button>
            </template>
            <template v-else>
              {{ t('auth.haveAccount') }}
              <button class="font-semibold text-brand-600 hover:underline" @click="go('signin')">
                {{ t('auth.signIn') }}
              </button>
            </template>
          </p>
          </div>

          <div v-if="mode === 'signin'" class="mt-5">
            <div class="flex items-center gap-3 mb-3">
              <span class="h-px grow bg-slate-200 dark:bg-slate-800" />
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {{ t('auth.demoAccounts') }}
              </span>
              <span class="h-px grow bg-slate-200 dark:bg-slate-800" />
            </div>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                v-for="account in demoAccounts"
                :key="account.email"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold
                       border border-slate-200 dark:border-slate-700
                       text-slate-600 dark:text-slate-300 transition
                       hover:text-brand-600 hover:border-brand-400
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                @click="form.email = account.email; form.password = 'demo1234'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ background: 'var(--c-primary)' }" />
                {{ account.role }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer class="shrink-0 px-5 sm:px-8 py-3 text-center">
        <p class="text-[11px] text-slate-400">© 2026 NovaPOS Systems</p>
      </footer>
    </main>
  </div>
</template>
