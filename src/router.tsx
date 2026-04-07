import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { FormPontaPage } from '@/pages/FormPontaPage'
import { FormADMPage } from '@/pages/FormADMPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/',           element: <DashboardPage /> },
      { path: '/form/ponta', element: <FormPontaPage /> },
      { path: '/form/adm',   element: <FormADMPage /> },
    ],
  },
])
