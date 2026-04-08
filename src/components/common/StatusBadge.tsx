type Status = string

const MAP: Record<string, { bg: string; color: string }> = {
  'Em dia':    { bg: 'rgba(0,230,118,.12)',  color: 'var(--green)'  },
  'Atrasada':  { bg: 'rgba(245,158,11,.12)', color: 'var(--yellow)' },
  'Não tomou': { bg: 'rgba(239,68,68,.12)',  color: 'var(--red)'    },
  ADM:         { bg: 'rgba(167,139,250,.12)',color: 'var(--purple)' },
  PONTA:       { bg: 'rgba(0,229,255,.12)',  color: 'var(--cyan)'   },
}

export function StatusBadge({ status }: { status: Status }) {
  const c = MAP[status] ?? { bg: 'rgba(255,255,255,.08)', color: 'var(--text-secondary)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: '.3px',
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  )
}