import { createBrowserRouter, Navigate } from 'react-router'

import { LoginPage } from '@/features/auth/login-page'

import { RequireStudent } from './require-student'
import { TempHome } from './temp-home'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireStudent />,
    children: [{ index: true, element: <TempHome /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
