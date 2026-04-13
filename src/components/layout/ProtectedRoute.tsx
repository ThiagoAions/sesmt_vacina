import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/auth'

/**
 * ProtectedRoute — "Guardião" das rotas do Dashboard
 * Verifica se a equipe do SESMT fez o login corretamente antes 
 * de renderizar os filhos. Caso contrário, redireciona para /login.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    // Se não estiver autenticado, vai para a tela de Login
    return <Navigate to="/login" replace />
  }

  // Se estiver, segue a vida normal
  return <Outlet />
}
