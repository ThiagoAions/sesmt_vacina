import { RefreshCw, Bell, Menu } from 'lucide-react'
import { useContext } from 'react'
import { SidebarContext } from './AppLayout'

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
}

export function Header({ title, subtitle, onRefresh }: HeaderProps) {
  const { toggle } = useContext(SidebarContext)

  const iconBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,.04)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8, padding: '7px 9px',
    color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', transition: 'border-color .15s',
  }

  return (
    <header className="header-padding" style={{
      height: 68,
      background: 'rgba(14,18,20,.88)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div className="header-title-box" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Botão de Menu (Só aparece no mobile via CSS) */}
        <button 
          className="mobile-menu-btn" 
          onClick={toggle} 
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onRefresh && (
          <button style={iconBtn} onClick={onRefresh} title="Atualizar dados">
            <RefreshCw size={14} />
          </button>
        )}
        <button style={iconBtn}>
          <Bell size={14} />
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,rgba(0,229,255,.4),rgba(0,230,118,.2))',
          border: '1px solid rgba(0,229,255,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'var(--cyan)',
        }}>S</div>
      </div>
    </header>
  )
}