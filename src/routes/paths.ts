/** Route builders, so links stay in sync with the route table. */
export const paths = {
  home: '/',
  topics: '/topics',
  /** `page` / `paragraph` ask the topic page to scroll to and highlight that text. */
  topic: (topicId: number, at?: { page?: number | null; paragraph?: string | null }) => {
    const query = new URLSearchParams()
    if (at?.page) query.set('page', String(at.page))
    if (at?.paragraph) query.set('paragraph', at.paragraph)
    const qs = query.toString()
    return `/topics/${topicId}${qs ? `?${qs}` : ''}`
  },
  quiz: (quizId: number) => `/quiz/${quizId}`,
  practice: (topicId: number) => `/practice/${topicId}`,
  checkpoint: (topicId: number) => `/checkpoint/${topicId}`,
  chat: (topicId: number) => `/chat/${topicId}`,
  attempt: (attemptId: number) => `/attempts/${attemptId}`,
  attemptResult: (attemptId: number) => `/attempts/${attemptId}/result`,
  attemptReview: (attemptId: number) => `/attempts/${attemptId}/review`,
  selfStudy: '/self-study',
  profile: '/profile',
  login: '/login',
} as const
