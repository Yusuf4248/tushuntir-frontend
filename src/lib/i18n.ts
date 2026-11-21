import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import uz from '@/locales/uz.json'

/**
 * Interface language: Uzbek by default, Russian or English when chosen, remembered on this
 * device. Only the interface is translated; topics, questions and AI text come from the API as is.
 */
export type Language = 'uz' | 'ru' | 'en'

/** Each language in its own name, so it can be found whatever the current language is. */
export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'uz', name: "O'zbekcha" },
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
]

const KEY = 'tushuntir.lang'

function storedLanguage(): Language {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'ru' || value === 'en' ? value : 'uz'
  } catch {
    return 'uz'
  }
}

void i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru }, en: { translation: en } },
  lng: storedLanguage(),
  fallbackLng: 'uz',
  supportedLngs: ['uz', 'ru', 'en'],
  // React escapes text itself.
  interpolation: { escapeValue: false },
  // The strings are bundled, so the first render already has them.
  initAsync: false,
})
document.documentElement.lang = i18n.language

/** The translate function, for components and plain modules alike. Call it at render time. */
export const t = i18n.t.bind(i18n)

export function currentLanguage(): Language {
  const lang = i18n.language
  return lang === 'ru' || lang === 'en' ? lang : 'uz'
}

/** The locale for Intl number formatting. */
export function intlLocale(): string {
  return { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' }[currentLanguage()]
}

export function setLanguage(language: Language): void {
  try {
    if (language === 'uz') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, language)
  } catch {
    // Still applied for this visit.
  }
  void i18n.changeLanguage(language)
  document.documentElement.lang = language
}

export default i18n

type ListKey =
  | 'time.months'
  | 'time.weekdays'
  | 'timetable.weekdaysShort'
  | 'attendance.monthsTitle'
  | 'attendance.weekdaysMonFirst'

/** A list of strings (month and weekday names) in the current language. */
export function tList(key: ListKey): string[] {
  return i18n.t(key, { returnObjects: true }) as unknown as string[]
}

/** A string for a key built from API data (a grade kind, a status), or undefined if unknown. */
export function tOptional(key: string): string | undefined {
  return i18n.exists(key) ? (i18n.t(key as never) as unknown as string) : undefined
}
