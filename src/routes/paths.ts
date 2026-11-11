/** Route builders, so links stay in sync with the route table. */
export const paths = {
  home: '/',
  topics: '/topics',
  topic: (topicId: number, page?: number | null) =>
    page ? `/topics/${topicId}?page=${page}` : `/topics/${topicId}`,
  topicQuiz: (topicId: number) => `/topics/${topicId}/quiz`,
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
