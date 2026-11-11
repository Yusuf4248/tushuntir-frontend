import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { FullScreenLayout } from '@/components/layout/full-screen-layout'
import { LoginPage } from '@/features/auth/login-page'
import { ChatPlaceholderPage } from '@/features/chat/chat-placeholder-page'
import { SelfStudyPage } from '@/features/chat/self-study-page'
import { CheckpointPlaceholderPage } from '@/features/checkpoint/checkpoint-placeholder-page'
import { HomePage } from '@/features/home/home-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { AttemptPage } from '@/features/quiz/attempt-page'
import { PracticeStartPage } from '@/features/quiz/practice-start-page'
import { QuizStartPage } from '@/features/quiz/quiz-start-page'
import { ResultPage } from '@/features/quiz/result-page'
import { ReviewPage } from '@/features/quiz/review-page'
import { TopicPage } from '@/features/topics/topic-page'
import { TopicsPage } from '@/features/topics/topics-page'

import { RequireStudent } from './require-student'
import { RootLayout } from './root-layout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireStudent />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'topics', element: <TopicsPage /> },
              { path: 'topics/:topicId', element: <TopicPage /> },
              { path: 'self-study', element: <SelfStudyPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
          {
            element: <FullScreenLayout />,
            children: [
              { path: 'quiz/:quizId', element: <QuizStartPage /> },
              { path: 'practice/:topicId', element: <PracticeStartPage /> },
              { path: 'attempts/:attemptId', element: <AttemptPage /> },
              { path: 'attempts/:attemptId/result', element: <ResultPage /> },
              { path: 'attempts/:attemptId/review', element: <ReviewPage /> },
              { path: 'checkpoint/:topicId', element: <CheckpointPlaceholderPage /> },
              { path: 'chat/:topicId', element: <ChatPlaceholderPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
