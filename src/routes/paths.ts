/** Route builders, so links stay in sync with the route table. */
export const paths = {
  home: '/',
  topics: '/topics',
  topic: (topicId: number) => `/topics/${topicId}`,
  topicQuiz: (topicId: number) => `/topics/${topicId}/quiz`,
  quiz: (quizId: number) => `/quiz/${quizId}`,
  practice: (topicId: number) => `/practice/${topicId}`,
  checkpoint: (topicId: number) => `/checkpoint/${topicId}`,
  selfStudy: '/self-study',
  profile: '/profile',
  login: '/login',
} as const
