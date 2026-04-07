import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DashboardStats } from '@/types'

interface Props { stats: DashboardStats | null; loading: boolean }

export function DoseChart({ stats, loading }: Props) {
  const data = stats
    ? [
        { name: '1ª Dose', value: stats.atrasados1Dose, color: '#F59E0B' },
        { name: '2ª Dose', value: stats.atrasados2Dose, color: '#EF4444' },
        { name: 'H1N1',    value: stats.semH1N1,        color: '#A78BFA' },
      ]
    : []

  return (
    <div style={{
      background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Doses em Atraso
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Colaboradores com doses pendentes ou atrasadas
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={36}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
          <XAxis
            dataKey="name" axisLine={false} tickLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,.03)' }}
            contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={loading ? 0.3 : 0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
