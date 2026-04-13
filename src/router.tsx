import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { ControlePage } from '@/pages/ControlePage'
import { ConfigPage } from '@/pages/ConfigPage'
import { FormADMPage } from '@/pages/FormADMPage'
import { FormPontaPage } from '@/pages/FormPontaPage'
import { LoginPage } from '@/pages/LoginPage'

export const router = createBrowserRouter([
  // ─── ROTA PÚBLICA DE LOGIN ───
  { path: '/login', element: <LoginPage /> },

  // ─── ROTA PÚBLICA DO FORMULÁRIO ───
  {
    element: <PublicLayout />,
    children: [
      { path: '/ponta', element: <FormPontaPage /> },
      { path: '/adm', element: <FormADMPage /> },
    ],
  },

  // ─── ROTA ADMIN PRIVADA (Protegida) ───
  {
    element: <ProtectedRoute />, // ⬅️ Guardião bloqueia acesso sem senha
    children: [
      {
        element: <AppLayout />, // ⬅️ Layout com Sidebar
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/controle', element: <ControlePage /> },
          { path: '/config', element: <ConfigPage /> },
        ],
      }
    ],
  },

  // ─── REDIRECIONAMENTOS (antigas rotas) ───
  { path: '/form/ponta', element: <Navigate to="/ponta" replace /> },
  { path: '/form/adm', element: <Navigate to="/adm" replace /> },
  { path: '/form', element: <Navigate to="/ponta" replace /> },
])
