import { Users, ShieldOff, Clock, AlertTriangle } from 'lucide-react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { KPICard } from '@/components/dashboard/KPICard'
import { H1N1Chart } from '@/components/dashboard/H1N1Chart'
import { DoseChart } from '@/components/dashboard/DoseChart'
import { ComparisonChart } from '@/components/dashboard/ComparisonChart'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useDashboard } from '@/hooks/useDashboard'
import { fmtDate } from '@/utils/formatters'

const grid4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 16,
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

export function DashboardPage() {
  const { stats, vacinacoes, loading, error, refetch } = useDashboard()

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Acompanhamento em tempo real do programa de vacinação"
        onRefresh={refetch}
      />

      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '12px 16px', background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.25)', borderRadius: 10,
            fontSize: 12, color: 'var(--red)',
          }}>
            ⚠️ Erro ao carregar dados da API: {error}
          </div>
        )}

        {/* KPI Cards */}
        <section style={grid4}>
          <KPICard
            label="Total Vacinações"
            value={loading ? '—' : stats?.total ?? 0}
            icon={Users}
            color="var(--cyan)"
            loading={loading}
          />
          <KPICard
            label="Sem H1N1"
            value={loading ? '—' : stats?.semH1N1 ?? 0}
            icon={ShieldOff}
            color="var(--red)"
            loading={loading}
          />
          <KPICard
            label="1ª Dose Atrasada"
            value={loading ? '—' : stats?.atrasados1Dose ?? 0}
            icon={Clock}
            color="var(--yellow)"
            loading={loading}
          />
          <KPICard
            label="2ª Dose Atrasada"
            value={loading ? '—' : stats?.atrasados2Dose ?? 0}
            icon={AlertTriangle}
            color="var(--purple)"
            loading={loading}
          />
        </section>

        {/* Charts Row */}
        <section style={grid2}>
          <H1N1Chart stats={stats} loading={loading} />
          <DoseChart stats={stats} loading={loading} />
        </section>

        {/* Comparison Chart full width */}
        <section>
          <ComparisonChart stats={stats} loading={loading} />
        </section>

        {/* Recent Records Table */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)', borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Registros Recentes
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 10 }}>
                ({vacinacoes.length} total)
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.25)' }}>
                  {['Colaborador', 'Área', 'Contrato', 'H1N1', '1ª Dose', '2ª Dose', 'Cadastro'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 600, letterSpacing: '.7px',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Carregando dados...
                    </td>
                  </tr>
                )}
                {!loading && vacinacoes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Nenhum registro encontrado no board.
                    </td>
                  </tr>
                )}
                {vacinacoes.slice(0, 15).map((v) => (
                  <tr
                    key={v.id}
                    style={{ borderTop: '1px solid var(--border-subtle)', transition: 'background .12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{v.colaboradorName}</td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.area} /></td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{v.contrato || '—'}</td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.statusH1N1} /></td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.status1Dose} /></td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.status2Dose} /></td>
                    <td style={{ padding: '13px 20px', fontSize: 11, color: 'var(--text-secondary)' }}>{fmtDate(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </>
  )
}
