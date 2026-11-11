/**
 * Short names for the generated OpenAPI types (`npm run api:types` refreshes schema.d.ts).
 * Fields added late (questionCount, hints, topicId, paragraphId, GET /me/attempts/:id) are read
 * with fallbacks in the features, so an older backend that omits them still works.
 */
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
export type StudentSubject = Schemas['StudentSubjectDto']
export type TopicDetail = Schemas['TopicDetailDto']

export type AttemptQuestion = Schemas['AttemptQuestionDto']
export type AttemptView = Schemas['AttemptViewDto']
export type AnswerResult = Schemas['AnswerResultDto']
export type HintResult = Schemas['HintDto']
export type SubmitResult = Schemas['SubmitResultDto']
export type SubmittedQuestion = Schemas['SubmittedQuestionDto']

export type Mistake = Schemas['MistakeDto']
export type Review = Schemas['ReviewDto']
export type ConfirmResult = Schemas['ConfirmResultDto']
export type AttemptHistoryItem = Schemas['AttemptHistoryItemDto']

export type ChatMessageBody = Schemas['ChatMessageDto']
export type ChatAction = NonNullable<ChatMessageBody['action']>
export type ChatSession = Schemas['ChatSessionDto']
export type ChatTurn = Schemas['ChatTurnDto']
export type ChatReply = Schemas['ChatReplyDto']
export type ChatExchange = Schemas['ChatExchangeDto']
export type ChatSource = Schemas['ChatSourceDto']

export type CheckpointStatus = Schemas['CheckpointStatusDto']
export type Checkpoint = Schemas['CheckpointDto']
export type SardorLine = Schemas['SardorLineDto']
export type CheckpointAnswerResult = Schemas['CheckpointAnswerResultDto']

/** What the API sends on an error. `message` is a string, or a list for validation errors. */
export type ApiErrorBody = {
  statusCode?: number
  message?: string | string[]
  error?: string
}
