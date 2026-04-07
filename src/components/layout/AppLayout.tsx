import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <main style={{
        marginLeft: 260, flex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        overflowX: 'hidden',
      }}>
        <Outlet />
      </main>
    </div>
  )
}