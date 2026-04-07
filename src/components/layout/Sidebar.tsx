import { NavLink } from 'react-router'
import { LayoutDashboard, Syringe, ClipboardList, Building2 } from 'lucide-react'
import { motion } from 'motion/react'

const NAV = [
  { to: '/',           label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/form/ponta', label: 'Form. Ponta',    icon: Syringe },
  { to: '/form/adm',   label: 'Form. ADM',      icon: ClipboardList },
]

const C = {
  sidebar:   { width: 260, minHeight: '100vh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' as const, position: 'fixed' as const, left: 0, top: 0, bottom: 0, zIndex: 40, overflow: 'hidden' },
  logo:      { padding: '22px 20px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon:  { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,229,255,.18), rgba(0,229,255,.08))', border: '1px solid rgba(0,229,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,229,255,.15)' },
  logoTitle: { fontSize: 13, fontWeight: 700 as const, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  logoSub:   { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 as const, letterSpacing: '.5px', textTransform: 'uppercase' as const },
  nav:       { padding: '12px 10px', flex: 1 },
  category:  { fontSize: 10, fontWeight: 600 as const, color: 'var(--text-muted)', letterSpacing: '.8px', textTransform: 'uppercase' as const, padding: '8px 10px 10px' },
  footer:    { padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.3px' },
}

export function Sidebar() {
  return (
    <aside style={C.sidebar}>
      <div style={C.logo}>
        <div style={C.logoIcon}><Building2 size={17} color="var(--cyan)" /></div>
        <div>
          <div style={C.logoTitle}>SESMT</div>
          <div style={C.logoSub}>Gestão de Vacinação</div>
        </div>
      </div>

      <nav style={C.nav}>
        <div style={C.category}>Menu</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
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

      <div style={C.footer}>v1.0.0 — SESMT © {new Date().getFullYear()}</div>
    </aside>
  )
}