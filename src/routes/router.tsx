import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { FullScreenLayout } from '@/components/layout/full-screen-layout'
import { LoginPage } from '@/features/auth/login-page'
import { SelfStudyPage } from '@/features/chat/self-study-page'
import { CheckpointPlaceholderPage } from '@/features/checkpoint/checkpoint-placeholder-page'
import { HomePage } from '@/features/home/home-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { QuizPlaceholderPage } from '@/features/quiz/quiz-placeholder-page'
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
              { path: 'quiz/:quizId', element: <QuizPlaceholderPage kind="quiz" /> },
              { path: 'topics/:topicId/quiz', element: <QuizPlaceholderPage kind="quiz" /> },
              { path: 'practice/:topicId', element: <QuizPlaceholderPage kind="practice" /> },
              { path: 'checkpoint/:topicId', element: <CheckpointPlaceholderPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
