type Status = string

const MAP: Record<string, { bg: string; color: string; border: string }> = {
  // Positivos (Tons de Verde/Teal)
  'Em dia':          { bg: 'rgba(16, 185, 129, 0.1)',  color: '#34D399', border: 'rgba(16, 185, 129, 0.2)' },
  
  // Em Andamento (Tons de Azul/Cyan)
  '1ª dose (Aguard. 2ª)': { bg: 'rgba(6, 182, 212, 0.1)',  color: '#22D3EE', border: 'rgba(6, 182, 212, 0.2)' },
  '2ª Dose (Aguard. 3ª)': { bg: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.2)' },
  '2ª Dose':              { bg: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.2)' },
  'Aguard. Reforço (10 anos)': { bg: 'rgba(99, 102, 241, 0.1)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.2)' },
  
  // Críticos (Tons de Vermelho/Laranja/Amarelo)
  'Atrasada':        { bg: 'rgba(239, 68, 68, 0.1)',  color: '#F87171', border: 'rgba(239, 68, 68, 0.2)' },
  'Não tomou':       { bg: 'rgba(249, 115, 22, 0.1)', color: '#FB923C', border: 'rgba(249, 115, 22, 0.2)' },
  'Em Análise':      { bg: 'rgba(234, 179, 8, 0.1)',  color: '#FACC15', border: 'rgba(234, 179, 8, 0.2)' },
  
  // Neutros
  'Não se aplica':   { bg: 'rgba(156, 163, 175, 0.1)',color: '#9CA3AF', border: 'rgba(156, 163, 175, 0.2)' },
  'ADM':             { bg: 'rgba(255, 255, 255, 0.05)',color: '#D1D5DB', border: 'rgba(255, 255, 255, 0.1)' },
  'PONTA':           { bg: 'rgba(255, 255, 255, 0.05)',color: '#D1D5DB', border: 'rgba(255, 255, 255, 0.1)' },
}

export function StatusBadge({ status }: { status: Status }) {
  const c = MAP[status] ?? { bg: 'rgba(255,255,255,.05)', color: 'var(--text-secondary)', border: 'rgba(255,255,255,.1)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 500, letterSpacing: '.3px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }}>
      {status}
    </span>
  )
}