/**
 * Every user-facing string of the student app, in Uzbek (Latin).
 * To add Russian later: create strings.ru.ts typed as `Strings` and pick one at startup.
 */
const uz = {
  app: {
    name: 'Tushuntir',
  },
  common: {
    retry: 'Qayta urinish',
    back: 'Orqaga',
    close: 'Yopish',
    loading: 'Yuklanmoqda…',
  },
  status: {
    not_started: 'Boshlanmagan',
    in_progress: 'Jarayonda',
    needs_practice: 'Mashq kerak',
    needs_help: 'Yordam kerak',
    mastered: "O'zlashtirildi",
    locked: 'Qulflangan',
  },
  states: {
    errorTitle: "Yuklab bo'lmadi",
    emptyTitle: "Hozircha hech narsa yo'q",
  },
}

type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> }

export type Strings = Widen<typeof uz>

export const t: Strings = uz
