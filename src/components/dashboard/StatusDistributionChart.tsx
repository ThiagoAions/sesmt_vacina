import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { VacinacaoItem } from '@/types'

interface Props { itens: VacinacaoItem[]; loading: boolean }

const COLORS = {
  'Em dia': '#10B981', 'Aguard. Reforço': '#818CF8', '1ª ou 2ª Dose': '#22D3EE',
  'Atrasado / Não tomou': '#EF4444', 'Não se aplica': '#6B7280'
}

export function StatusDistributionChart({ itens, loading }: Props) {
  const data = useMemo(() => {
    let emDia = 0, aguardando = 0, andamento = 0, atrasado = 0, naoSeAplica = 0;
    
    itens.forEach(v => {
      const statuses = [v.statusHepatiteB, v.statusDuplaAdulta, v.statusTripliceViral, v.statusFebreAmarela, v.statusInfluenza, v.statusPneumococica, v.statusHerpesZoster, v.statusH1N1] as string[]
      statuses.forEach(s => {
        if (s === 'Em dia') emDia++;
        else if (s === 'Aguard. Reforço') aguardando++;
        else if (s === '1ª Dose' || s === '2ª Dose') andamento++;
        else if (s === 'Atrasada' || s === 'Não tomou') atrasado++;
        else if (s === 'Não se aplica') naoSeAplica++;
      })
    })

    return [
      { name: 'Em dia', value: emDia, color: COLORS['Em dia'] },
      { name: 'Aguard. Reforço', value: aguardando, color: COLORS['Aguard. Reforço'] },
      { name: '1ª ou 2ª Dose', value: andamento, color: COLORS['1ª ou 2ª Dose'] },
      { name: 'Atrasado / Não tomou', value: atrasado, color: COLORS['Atrasado / Não tomou'] },
      { name: 'Não se aplica', value: naoSeAplica, color: COLORS['Não se aplica'] }
    ].filter(d => d.value > 0)
  }, [itens])

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Distribuição Global</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>Visão geral de todos os 8 status vacinais</p>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} cursor={false} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
