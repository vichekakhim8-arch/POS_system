<script setup>
import { ref } from 'vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import QrCode from '@/components/ui/QrCode.vue'
import { usePaymentsStore } from '@/stores/payments'
import { useUiStore } from '@/stores/ui'

const payments = usePaymentsStore()
const ui = useUiStore()

const tokenDraft = ref('')
const editingToken = ref(false)
const showPreview = ref(false)

const saveToken = () => {
  if (!tokenDraft.value.trim()) return ui.notify('Paste a token first', 'error')
  payments.rotateToken(tokenDraft.value)
  tokenDraft.value = ''
  editingToken.value = false
  ui.notify('Bakong token updated')
}

const removeToken = () => {
  payments.clearToken()
  ui.notify('Bakong token removed')
}

const test = async () => {
  const result = await payments.testConnection()
  ui.notify(result.message, result.ok ? 'success' : 'error')
}
</script>

<template>
  <section class="card overflow-hidden">
    <header class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
      <span class="w-10 h-10 rounded-xl bg-[#e21c21]/10 text-[#e21c21] flex items-center justify-center shrink-0">
        <Icon name="qr" />
      </span>
      <div class="min-w-0 grow">
        <h3 class="font-semibold text-slate-900 dark:text-white">Bakong / KHQR</h3>
        <p class="text-xs text-slate-400">Connect your merchant account to accept KHQR payments.</p>
      </div>
      <span
        class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0"
        :class="
          payments.bakongReady
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
        "
      >
        {{ payments.bakongReady ? 'Connected' : 'Not configured' }}
      </span>
    </header>

    <div class="p-5 space-y-5">
      <!-- environment -->
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <span class="label">Environment</span>
          <div class="segmented w-full">
            <button
              v-for="env in ['sandbox', 'production']"
              :key="env"
              type="button"
              class="segmented-item flex-1 capitalize"
              :class="payments.bakong.environment === env ? 'segmented-item-active' : ''"
              @click="payments.update('bakong', { environment: env })"
            >
              {{ env }}
            </button>
          </div>
          <p v-if="payments.isProduction" class="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600">
            <Icon name="alert" size="w-3.5 h-3.5" class="shrink-0 mt-px" />
            Live mode — real customer payments will be processed.
          </p>
        </div>

        <label
          class="flex items-center justify-between gap-3 p-3.5 rounded-xl border self-end cursor-pointer transition"
          :class="
            payments.bakong.enabled
              ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5'
              : 'border-slate-200 dark:border-slate-700'
          "
        >
          <span>
            <span class="block text-sm font-medium text-slate-700 dark:text-slate-200">Enable KHQR at POS</span>
            <span class="block text-xs text-slate-400">Show KHQR in the payment modal</span>
          </span>
          <input
            type="checkbox"
            class="w-5 h-5 rounded accent-brand-600"
            :checked="payments.bakong.enabled"
            @change="payments.update('bakong', { enabled: $event.target.checked })"
          />
        </label>
      </div>

      <!-- merchant identity -->
      <div class="grid sm:grid-cols-2 gap-4">
        <Input
          :model-value="payments.bakong.merchantName"
          label="Merchant name *"
          icon="store"
          placeholder="NovaPOS Retail"
          @update:model-value="payments.update('bakong', { merchantName: $event })"
        />
        <Input
          :model-value="payments.bakong.accountId"
          label="Bakong account ID *"
          icon="user"
          placeholder="your_name@bank"
          hint="The KHQR account that receives funds"
          @update:model-value="payments.update('bakong', { accountId: $event })"
        />
        <Input
          :model-value="payments.bakong.merchantId"
          label="Merchant ID"
          placeholder="Optional"
          @update:model-value="payments.update('bakong', { merchantId: $event })"
        />
        <Input
          :model-value="payments.bakong.city"
          label="City"
          placeholder="Phnom Penh"
          @update:model-value="payments.update('bakong', { city: $event })"
        />
      </div>

      <!-- API credentials -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div class="flex items-center gap-2">
          <Icon name="shield" size="w-4 h-4" class="text-brand-600" />
          <h4 class="text-sm font-semibold text-slate-900 dark:text-white">API credentials</h4>
        </div>

        <Input
          :model-value="payments.bakong.apiBaseUrl"
          label="API base URL"
          placeholder="https://api-bakong.nbc.gov.kh/v1"
          @update:model-value="payments.update('bakong', { apiBaseUrl: $event })"
        />

        <div>
          <span class="label">API token</span>

          <!-- stored state -->
          <div
            v-if="payments.bakong.token && !editingToken"
            class="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-surface-subtle"
          >
            <code class="font-mono text-xs text-slate-600 dark:text-slate-300 grow truncate">
              {{ payments.maskedToken }}
            </code>
            <Button size="sm" variant="secondary" icon="refresh" @click="editingToken = true">Rotate</Button>
            <Button size="sm" variant="ghost" icon="trash" @click="removeToken">Remove</Button>
          </div>

          <!-- entry state -->
          <div v-else class="flex flex-col sm:flex-row gap-2">
            <Input
              v-model="tokenDraft"
              type="password"
              class="grow"
              placeholder="Paste your Bakong API token"
            />
            <div class="flex gap-2">
              <Button icon="check" @click="saveToken">Save token</Button>
              <Button v-if="payments.bakong.token" variant="secondary" @click="editingToken = false">
                Cancel
              </Button>
            </div>
          </div>

          <p class="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
            <Icon name="alert" size="w-3.5 h-3.5" class="shrink-0 mt-px" />
            Never ship a production secret in frontend code. In production this field should store a
            short-lived token issued by your own backend, which proxies every Bakong request.
          </p>
        </div>

        <Input
          :model-value="payments.bakong.callbackUrl"
          label="Webhook / callback URL"
          placeholder="https://api.yourstore.com/webhooks/bakong"
          @update:model-value="payments.update('bakong', { callbackUrl: $event })"
        />

        <div class="grid sm:grid-cols-2 gap-4">
          <Input
            :model-value="payments.bakong.timeoutSeconds"
            label="QR timeout (seconds)"
            type="number"
            min="30"
            suffix-text="s"
            @update:model-value="payments.update('bakong', { timeoutSeconds: Number($event) })"
          />
          <label
            class="flex items-center justify-between gap-3 p-3.5 rounded-xl border self-end cursor-pointer
                   border-slate-200 dark:border-slate-700"
          >
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Auto-verify payment</span>
            <input
              type="checkbox"
              class="w-5 h-5 rounded accent-brand-600"
              :checked="payments.bakong.autoVerify"
              @change="payments.update('bakong', { autoVerify: $event.target.checked })"
            />
          </label>
        </div>
      </div>

      <!-- actions -->
      <div class="flex flex-wrap items-center gap-2">
        <Button :loading="payments.testing" icon="refresh" @click="test">Test connection</Button>
        <Button variant="secondary" icon="qr" @click="showPreview = !showPreview">
          {{ showPreview ? 'Hide' : 'Preview' }} QR
        </Button>
        <Button variant="ghost" @click="payments.reset('bakong')">Reset</Button>

        <p
          v-if="payments.lastTest"
          class="text-xs font-medium ml-auto"
          :class="payments.lastTest.ok ? 'text-emerald-600' : 'text-rose-600'"
        >
          {{ payments.lastTest.message }}
          <span class="text-slate-400 font-normal">· {{ payments.lastTest.at }}</span>
        </p>
      </div>

      <!-- live QR preview -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="showPreview"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-xs"
        >
          <div class="bg-[#e21c21] text-white px-4 py-2.5 flex items-center justify-between">
            <span class="font-bold tracking-wide text-sm">KHQR</span>
            <span class="text-[11px] opacity-90 uppercase">{{ payments.bakong.environment }}</span>
          </div>
          <div class="p-5 text-center bg-white">
            <p class="text-sm font-semibold text-slate-700">{{ payments.bakong.merchantName || 'Merchant' }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">$10.00</p>
            <div class="mt-3 inline-block p-3 rounded-2xl border border-slate-200">
              <QrCode :value="payments.buildQrPayload(10, 'PREVIEW')" :size="170" />
            </div>
            <p class="mt-2 text-[11px] text-slate-400">{{ payments.bakong.accountId || 'account@bank' }}</p>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>
