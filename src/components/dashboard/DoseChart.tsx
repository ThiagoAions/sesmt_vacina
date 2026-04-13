import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { DashboardStats } from '@/types'

interface Props { 
  stats: DashboardStats | null; 
  loading: boolean;
  onClick?: (vacinaName: string) => void;
  activeBar?: string | null;
}

export function DoseChart({ stats, loading, onClick, activeBar }: Props) {
  const data = stats ? [
    { name: 'Hepatite B', value: stats.atrasoHepatiteB, color: '#F59E0B' },
    { name: 'Dupla (dT)', value: stats.atrasoDuplaAdulta, color: '#EF4444' },
    { name: 'T. Viral', value: stats.atrasoTripliceViral, color: '#A78BFA' },
    { name: 'F. Amarela', value: stats.atrasoFebreAmarela, color: '#3B82F6' },
    { name: 'Influenza', value: stats.atrasoInfluenza, color: '#10B981' },
    { name: 'Pneumo 23', value: stats.atrasoPneumococica, color: '#F472B6' },
    { name: 'H. Zóster', value: stats.atrasoHerpesZoster, color: '#8B5CF6' },
    { name: 'COVID-19', value: stats.atrasoH1N1, color: '#00E5FF' }, // ⬅️ AQUI FOI CORRIGIDO PARA COVID-19
  ] : []

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
           <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Doses em Atraso por Vacina</p>
           <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>👆 Clique em uma barra para filtrar a tabela</p>
        </div>
        {activeBar && (
          <button onClick={() => onClick?.('')} style={{ background: 'transparent', border: '1px solid var(--border-active)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--cyan)', cursor: 'pointer', transition: 'all .2s' }}>
            Limpar Filtro
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={24} onClick={(data) => { if (data && data.activePayload) onClick?.(data.activePayload[0].payload.name) }} style={{ cursor: onClick ? 'pointer' : 'default' }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
          {/* ⬅️ AQUI ADICIONAMOS interval={0} PARA FORÇAR O NOME A APARECER */}
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,.03)' }} contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
               <Cell key={i} fill={d.color} fillOpacity={loading ? 0.3 : (activeBar && activeBar !== d.name ? 0.2 : 0.85)} style={{ transition: 'all 0.3s ease' }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
