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
  errors: {
    network: "Internetga ulanib bo'lmadi. Aloqani tekshirib, qayta urinib ko'ring.",
    validation: "Kiritilgan ma'lumotlarda xato bor.",
    sessionExpired: 'Sessiya tugadi. Iltimos, qaytadan kiring.',
    forbidden: "Bu amal uchun ruxsat yo'q.",
    notFound: "Ma'lumot topilmadi.",
    conflict: "Bu amalni hozir bajarib bo'lmaydi.",
    tooManyRequests: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
    aiBusy: "AI hozir band, birozdan keyin urinib ko'ring",
    server: "Serverda xatolik. Birozdan keyin qayta urinib ko'ring.",
    unknown: "Nimadir xato ketdi. Qayta urinib ko'ring.",
  },
  auth: {
    title: 'Kirish',
    subtitle: "O'quvchi hisobingizga kiring",
    phone: 'Telefon raqami',
    phonePlaceholder: '90 123 45 67',
    phoneInvalid: "Telefon raqamini to'liq kiriting: 9 ta raqam.",
    password: 'Parol',
    passwordRequired: 'Parolni kiriting.',
    showPassword: "Parolni ko'rsatish",
    hidePassword: 'Parolni yashirish',
    submit: 'Kirish',
    wrongCredentials: "Telefon raqami yoki parol noto'g'ri.",
    deactivated: 'Hisobingiz faol emas. Maktab administratoriga murojaat qiling.',
    forgotHint: 'Parolni unutdingizmi? Sinf rahbaringizga murojaat qiling.',
    restoring: 'Sessiya tiklanmoqda…',
    studentsOnly: "Bu ilova o'quvchilar uchun",
    studentsOnlyHint: (name: string) =>
      `${name}, siz o'quvchi hisobi bilan kirmadingiz. O'qituvchi va administratorlar uchun boshqa panel bor.`,
    otherAccount: 'Boshqa hisob bilan kirish',
    logout: 'Chiqish',
  },
  nav: {
    label: 'Asosiy menyu',
    home: 'Bosh sahifa',
    topics: 'Darsliklar',
    selfStudy: "Mustaqil ta'lim",
    profile: 'Profil',
  },
  placeholder: {
    title: 'Tez orada',
    description: "Bu bo'lim keyingi bosqichda qo'shiladi.",
    quiz: 'Quiz',
    practice: 'Mashq',
    checkpoint: 'Tushuntir',
    close: 'Yopish',
  },
  selfStudy: {
    title: "Mustaqil ta'lim",
    description: "Istalgan mavzu bo'yicha savol bering — yordamchi darslikka tayanib tushuntiradi.",
  },
  profile: {
    title: 'Profil',
    phone: 'Telefon',
    school: 'Maktab',
  },
}

type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> }

export type Strings = Widen<typeof uz>

export const t: Strings = uz
