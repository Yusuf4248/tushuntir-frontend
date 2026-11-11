import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { FullScreenLayout } from '@/components/layout/full-screen-layout'
import { LoginPage } from '@/features/auth/login-page'
import { SelfStudyPage } from '@/features/chat/self-study-page'
import { HomePage } from '@/features/home/home-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { TopicsPage } from '@/features/topics/topics-page'

import { NotFoundPage } from './not-found-page'
import { RequireStudent } from './require-student'
import { RootLayout } from './root-layout'
import { RouteError } from './route-error'
import { RouteLoading } from './route-loading'

// The tabs load with the app; the quiz, chat, checkpoint and topic reader load on first use.
const quiz = () => import('@/features/quiz/routes')
const chat = () => import('@/features/chat/chat-page')
const checkpoint = () => import('@/features/checkpoint/checkpoint-page')
const topic = () => import('@/features/topics/topic-page')

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <RouteLoading />,
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
              {
                path: 'topics/:topicId',
                handle: { wide: true },
                lazy: async () => ({ Component: (await topic()).TopicPage }),
              },
              { path: 'self-study', element: <SelfStudyPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
          {
            path: 'chat/:topicId',
            lazy: async () => ({ Component: (await chat()).ChatPage }),
          },
          {
            element: <FullScreenLayout />,
            children: [
              {
                path: 'quiz/:quizId',
                lazy: async () => ({ Component: (await quiz()).QuizStartPage }),
              },
              {
                path: 'practice/:topicId',
                lazy: async () => ({ Component: (await quiz()).PracticeStartPage }),
              },
              {
                path: 'attempts/:attemptId',
                lazy: async () => ({ Component: (await quiz()).AttemptPage }),
              },
              {
                path: 'attempts/:attemptId/result',
                lazy: async () => ({ Component: (await quiz()).ResultPage }),
              },
              {
                path: 'attempts/:attemptId/review',
                lazy: async () => ({ Component: (await quiz()).ReviewPage }),
              },
              {
                path: 'checkpoint/:topicId',
                lazy: async () => ({ Component: (await checkpoint()).CheckpointPage }),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
