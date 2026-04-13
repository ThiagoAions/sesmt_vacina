import { Outlet } from 'react-router'
import { Building2 } from 'lucide-react'

/**
 * PublicLayout — Layout público sem sidebar/menu.
 * Usado para o formulário de cadastro de vacinação acessível via link direto.
 * O colaborador abre no celular, preenche e envia sem ver nada do Dashboard.
 */
export function PublicLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header — usa var para respeitar light-theme (PONTA) */}
      <header style={{
        height: 56,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 0 var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,229,255,.2), rgba(0,229,255,.08))',
            border: '1px solid rgba(0,229,255,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(0,229,255,.18)',
          }}>
            <Building2 size={15} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>SESMT</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '.5px', textTransform: 'uppercase' }}>Cadastro de Vacinação</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowX: 'hidden' }}>
        <Outlet />
      </main>

      {/* Footer Mínimo */}
      <footer style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--text-muted)',
      }}>
        SESMT — Gestão de Vacinação © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
