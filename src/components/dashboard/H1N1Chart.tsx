import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DashboardStats } from '@/types'

interface Props { stats: DashboardStats | null; loading: boolean }

const COLORS = ['#EF4444', '#00E5FF']

export function H1N1Chart({ stats, loading }: Props) {
  const data = stats
    ? [
        { name: 'Sem H1N1', value: stats.semH1N1 },
        { name: 'Com H1N1', value: stats.total - stats.semH1N1 },
      ]
    : []

  return (
    <div style={{
      background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Cobertura H1N1
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Colaboradores sem vacina H1N1
      </p>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={55} outerRadius={85}
              paddingAngle={3} dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: 'var(--text-primary)' }}
              cursor={false}
            />
            <Legend
              iconType="circle" iconSize={8}
              formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
