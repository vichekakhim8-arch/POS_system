import { createI18n } from 'vue-i18n'
import en from './locales/en'
import km from './locales/km'

export const availableLocales = [
  { code: 'en', label: 'English', native: 'English (US)', short: 'EN', flag: '🇺🇸' },
  { code: 'km', label: 'ភាសាខ្មែរ', native: 'Khmer', short: 'ខ្មែរ', flag: '🇰🇭' }
]

const saved = localStorage.getItem('novapos-locale')

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: saved && ['en', 'km'].includes(saved) ? saved : 'en',
  fallbackLocale: 'en',
  messages: { en, km }
})

export const setLocale = (code) => {
  i18n.global.locale.value = code
  localStorage.setItem('novapos-locale', code)
  document.documentElement.setAttribute('lang', code)
  document.documentElement.classList.toggle('font-khmer', code === 'km')
}

setLocale(i18n.global.locale.value)

export default i18n
