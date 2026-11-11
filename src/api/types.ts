/** Short names for the generated OpenAPI types (`npm run api:types` refreshes schema.d.ts). */
import type { components } from './schema'

type Schemas = components['schemas']

/** Password and refresh-token hashes are never sent by the API, so they are dropped here. */
export type AuthUser = Omit<Schemas['User'], 'passwordHash' | 'refreshTokenHash'>
export type UserRole = AuthUser['role']
export type TokenResponse = Omit<Schemas['TokenResponseDto'], 'user'> & { user: AuthUser }
export type LoginBody = Schemas['LoginDto']

export type Today = Schemas['TodayDto']
export type TodayLesson = Schemas['TodayLessonDto']
export type LessonStatus = TodayLesson['status']
export type StudentQuiz = Schemas['StudentQuizDto']
export type QuizList = Schemas['QuizListDto']
export type WeakTopic = Schemas['WeakTopicDto']
export type MasteryList = Schemas['MasteryListDto']
export type MasteryTopic = Schemas['MasteryTopicDto']
export type MasteryStatus = MasteryTopic['status']
export type FinishLessonResponse = Schemas['FinishLessonResponseDto']

/** What the API sends on an error. `message` is a string, or a list for validation errors. */
export type ApiErrorBody = {
  statusCode?: number
  message?: string | string[]
  error?: string
}
