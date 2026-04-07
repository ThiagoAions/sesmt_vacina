import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { DashboardStats } from '@/types'
import { fmtPercent } from '@/utils/formatters'

interface Props { stats: DashboardStats | null; loading: boolean }

export function ComparisonChart({ stats, loading }: Props) {
  const data = stats
    ? [
        {
          name: 'ADM',
          Regulares: stats.admRegulares,
          Irregular:  stats.admTotal - stats.admRegulares,
          total:      stats.admTotal,
        },
        {
          name: 'Ponta',
          Regulares: stats.pontaRegulares,
          Irregular:  stats.pontaTotal - stats.pontaRegulares,
          total:      stats.pontaTotal,
        },
      ]
    : []

  return (
    <div style={{
      background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        ADM vs. Ponta — Regularidade
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Comparativo de colaboradores com vacinação completa
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4} barSize={30}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,.03)' }}
            contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(val: number, _, props) => [
              `${val} (${fmtPercent(val, props.payload.total)})`,
            ]}
          />
          <Legend
            iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>}
          />
          <Bar dataKey="Regulares" fill="#00E676" fillOpacity={loading ? .3 : .85} radius={[6, 6, 0, 0]} />
          <Bar dataKey="Irregular"  fill="#EF4444" fillOpacity={loading ? .3 : .85} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
