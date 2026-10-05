import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useThemeStore } from './stores/theme'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Apply the persisted theme before the first render — no flash of wrong theme.
useThemeStore(pinia).init()

app.use(router)
app.use(i18n)
app.mount('#app')
