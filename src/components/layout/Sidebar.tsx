import { NavLink } from 'react-router'
import { LayoutDashboard, Users, Settings, Building2, LogOut } from 'lucide-react'
import { motion } from 'motion/react'
import { useContext } from 'react'
import { SidebarContext } from './AppLayout'
import { useAuth } from '@/contexts/auth'

const NAV = [
  { to: '/',           label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/controle',   label: 'Controle',       icon: Users },
  { to: '/config',     label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const { isOpen, close } = useContext(SidebarContext)
  const { logout } = useAuth()

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`} style={{
      width: 260, minHeight: '100vh', background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40, overflow: 'hidden'
    }}>
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,229,255,.18), rgba(0,229,255,.08))', border: '1px solid rgba(0,229,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,229,255,.15)' }}>
          <Building2 size={17} color="var(--cyan)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>SESMT</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '.5px', textTransform: 'uppercase' }}>Gestão de Vacinação</div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '.8px', textTransform: 'uppercase', padding: '8px 10px 10px' }}>Menu</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={close} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.12 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(0,229,255,.13), rgba(0,229,255,.04))'
                    : 'transparent',
                  borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
                  color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', transition: 'color .15s, background .15s',
                }}
              >
                <Icon size={16} />
                {label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 10px' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: 'transparent', border: 'none',
            color: 'var(--red)', fontSize: 13, cursor: 'pointer',
            transition: 'background .15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-muted)' }}>
        v1.0.0 — SESMT © {new Date().getFullYear()}
      </div>
    </aside>
  )
}