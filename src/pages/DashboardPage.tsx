import React, { useState, useMemo } from 'react'
import { 
  Users, ShieldOff, Clock, AlertTriangle, Search, Pencil, X, CheckCircle2, 
  Download, FilterX, ChevronUp, ChevronDown, ArrowUpDown 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { Header } from '@/components/layout/Header'
import { KPICard } from '@/components/dashboard/KPICard'
import { H1N1Chart } from '@/components/dashboard/H1N1Chart'
import { DoseChart } from '@/components/dashboard/DoseChart'
import { ComparisonChart } from '@/components/dashboard/ComparisonChart'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'

import { useDashboard } from '@/hooks/useDashboard'
import { atualizarVacinacao } from '@/api/monday'
import { fmtDate } from '@/utils/formatters'
import type { VacinacaoItem } from '@/types'

const STATUS_OPTIONS = [
  { value: 'Em dia', label: 'Em dia ✅' },
  { value: 'Atrasada', label: 'Atrasada ⚠️' },
  { value: 'Não tomou', label: 'Não tomou ❌' },
]

// ─── TOAST DE SUCESSO (NOTIFICAÇÃO FLUTUANTE) ───
function SuccessToast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          style={{
            position: 'fixed', top: 32, left: '50%', zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white', padding: '12px 24px', borderRadius: 10,
            boxShadow: '0 10px 40px rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600
          }}
        >
          <CheckCircle2 size={20} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── COMPONENTE DROPDOWN CUSTOMIZADO ───
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  width = 'auto'
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  width?: string | number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const click = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '9px 14px', fontSize: 12, color: 'var(--text-primary)',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all .2s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
        onMouseLeave={e => !isOpen && (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      >
        <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{label}:</span>
        <span>{value}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ fontSize: 10, marginLeft: 8, opacity: 0.5 }}>▼</motion.span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: '#121619', border: '1px solid var(--border-active)',
              borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: 4
            }}
          >
            {options.map(o => (
              <div
                key={o}
                onClick={() => { onChange(o); setIsOpen(false) }}
                style={{
                  padding: '10px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
                  color: value === o ? 'var(--cyan)' : 'var(--text-primary)',
                  background: value === o ? 'rgba(0,229,255,.05)' : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                onMouseLeave={e => e.currentTarget.style.background = value === o ? 'rgba(0,229,255,.05)' : 'transparent'}
              >
                {o}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DashboardPage() {
  const { stats, vacinacoes, loading, error, refetch } = useDashboard()

  // ─── ESTADOS DOS FILTROS ───
  const [buscaNome, setBuscaNome]         = useState('')
  const [filtroArea, setFiltroArea]       = useState('Todas')
  const [filtroContrato, setFiltroContrato] = useState('Todos')
  const [filtroUnidade, setFiltroUnidade]   = useState('Todas')
  const [filtroTabela, setFiltroTabela]     = useState<'Todos' | 'Atrasados' | 'Sem H1N1'>('Todos')

  // ─── ESTADOS DE PAGINAÇÃO E ORDENAÇÃO ───
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(25)
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({ coluna: '', direcao: 'asc' })

  // ─── ESTADOS DA EDIÇÃO (MODAL) ───
  const [editingItem, setEditingItem] = useState<VacinacaoItem | null>(null)
  const [editForm, setEditForm]       = useState({ area: '', statusH1N1: '', status1Dose: '', status2Dose: '' })
  const [isSaving, setIsSaving]       = useState(false)
  const [showToast, setShowToast]     = useState(false)

  // Extrai listas únicas do board para alimentar os selects de filtro
  const contratosUnicos = useMemo(() =>
    ['Todos', ...new Set(vacinacoes.map(v => v.contrato).filter(Boolean))].sort(),
  [vacinacoes])

  const unidadesUnicas = useMemo(() =>
    ['Todas', ...new Set(vacinacoes.map(v => v.unidade).filter(Boolean))].sort(),
  [vacinacoes])

  // Aplica todos os filtros juntos
  const registrosFiltrados = useMemo(() => {
    return vacinacoes.filter(v => {
      // 1. Filtro Rápido (Atrasados/Sem H1N1)
      if (filtroTabela === 'Atrasados' && v.status1Dose !== 'Atrasada' && v.status2Dose !== 'Atrasada') return false
      if (filtroTabela === 'Sem H1N1' && v.statusH1N1 !== 'Não tomou') return false

      // 2. Busca Nominal
      if (buscaNome && !v.colaboradorName.toLowerCase().includes(buscaNome.toLowerCase())) return false

      // 3. Filtros Específicos
      if (filtroArea !== 'Todas' && v.area !== filtroArea) return false
      if (filtroContrato !== 'Todos' && v.contrato !== filtroContrato) return false
      if (filtroUnidade !== 'Todas' && v.unidade !== filtroUnidade) return false

      return true
    })
  }, [vacinacoes, filtroTabela, buscaNome, filtroArea, filtroContrato, filtroUnidade])

  // ─── ORDENAÇÃO ───
  const registrosOrdenados = useMemo(() => {
    if (!ordenacao.coluna) return registrosFiltrados

    const sorted = [...registrosFiltrados].sort((a, b) => {
      let aVal: any, bVal: any

      switch (ordenacao.coluna) {
        case 'nome':
          aVal = a.colaboradorName.toLowerCase()
          bVal = b.colaboradorName.toLowerCase()
          break
        case 'area':
          aVal = a.area
          bVal = b.area
          break
        case 'contrato':
          aVal = a.contrato || ''
          bVal = b.contrato || ''
          break
        case 'h1n1':
          aVal = a.statusH1N1
          bVal = b.statusH1N1
          break
        case '1dose':
          aVal = a.status1Dose
          bVal = b.status1Dose
          break
        case '2dose':
          aVal = a.status2Dose
          bVal = b.status2Dose
          break
        default:
          return 0
      }

      if (aVal < bVal) return ordenacao.direcao === 'asc' ? -1 : 1
      if (aVal > bVal) return ordenacao.direcao === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [registrosFiltrados, ordenacao])

  // ─── PAGINAÇÃO ───
  const totalPaginas = Math.ceil(registrosOrdenados.length / itensPorPagina)
  const registrosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina
    return registrosOrdenados.slice(inicio, inicio + itensPorPagina)
  }, [registrosOrdenados, paginaAtual, itensPorPagina])

  // Resetar página ao mudar filtros
  React.useEffect(() => {
    setPaginaAtual(1)
  }, [buscaNome, filtroArea, filtroContrato, filtroUnidade, filtroTabela])

  // Contador de filtros ativos
  const filtrosAtivos = useMemo(() => {
    let count = 0
    if (filtroArea !== 'Todas') count++
    if (filtroContrato !== 'Todos') count++
    if (filtroUnidade !== 'Todas') count++
    if (filtroTabela !== 'Todos') count++
    if (buscaNome) count++
    return count
  }, [filtroArea, filtroContrato, filtroUnidade, filtroTabela, buscaNome])

  // Limpar todos os filtros
  const limparFiltros = () => {
    setBuscaNome('')
    setFiltroArea('Todas')
    setFiltroContrato('Todos')
    setFiltroUnidade('Todas')
    setFiltroTabela('Todos')
  }

  // Função de ordenação
  const handleSort = (coluna: string) => {
    if (ordenacao.coluna === coluna) {
      setOrdenacao({ coluna, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })
    } else {
      setOrdenacao({ coluna, direcao: 'asc' })
    }
  }

  // Abre a tela de edição
  const handleEditClick = (item: VacinacaoItem) => {
    setEditingItem(item)
    setEditForm({
      area: item.area,
      statusH1N1: item.statusH1N1,
      status1Dose: item.status1Dose,
      status2Dose: item.status2Dose
    })
  }

  // Salva no Monday e atualiza a tela
  const handleSaveEdit = async () => {
    if (!editingItem) return
    setIsSaving(true)
    try {
      await atualizarVacinacao({ itemId: editingItem.id, ...editForm })
      setEditingItem(null)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      refetch() 
    } catch (e) {
      alert('Erro ao atualizar dados no Monday.')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── EXPORTAR PARA CSV ───
  const exportarParaExcel = () => {
    const headers = ['Colaborador', 'Unidade', 'Área', 'Contrato', 'H1N1', '1ª Dose', '2ª Dose']
    const csvContent = [
      headers.join(','),
      ...registrosOrdenados.map(v => [
        `"${v.colaboradorName}"`,
        `"${v.unidade}"`,
        v.area,
        `"${v.contrato || ''}"`,
        v.statusH1N1,
        v.status1Dose,
        v.status2Dose
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dashboard-vacinacao-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // ─── ÍCONE DE ORDENAÇÃO ───
  const SortIcon = ({ coluna }: { coluna: string }) => {
    if (ordenacao.coluna !== coluna) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
    return ordenacao.direcao === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  return (
    <>
      <SuccessToast show={showToast} message="Dados atualizados com sucesso!" />
      
      <Header
        title="Dashboard"
        subtitle="Acompanhamento em tempo real do programa de vacinação"
        onRefresh={refetch}
      />

      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {error && (
          <div style={{
            padding: '12px 16px', background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.25)', borderRadius: 10,
            fontSize: 12, color: 'var(--red)'
          }}>
            ⚠️ Erro API: {error}
          </div>
        )}

        {/* KPI Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <KPICard label="Total Vacinações" value={loading ? '—' : stats?.total ?? 0} icon={Users} color="var(--cyan)" loading={loading} />
          <KPICard label="Sem H1N1" value={loading ? '—' : stats?.semH1N1 ?? 0} icon={ShieldOff} color="var(--red)" loading={loading} />
          <KPICard label="1ª Dose Atrasada" value={loading ? '—' : stats?.atrasados1Dose ?? 0} icon={Clock} color="var(--yellow)" loading={loading} />
          <KPICard label="2ª Dose Atrasada" value={loading ? '—' : stats?.atrasados2Dose ?? 0} icon={AlertTriangle} color="var(--purple)" loading={loading} />
        </section>

        {/* Charts Row */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <H1N1Chart stats={stats} loading={loading} />
          <DoseChart stats={stats} loading={loading} />
        </section>

        {/* Comparison Chart full width */}
        <section>
          <ComparisonChart stats={stats} loading={loading} />
        </section>

        {/* ─── TABELA DE CONTROLE ─── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)', borderRadius: 14,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            {/* TÍTULO E BOTÕES DE FILTRO RÁPIDO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Controle Nominal 
                  {filtrosAtivos > 0 && (
                    <span style={{ 
                      marginLeft: 8, background: 'var(--cyan)', color: 'var(--bg-primary)', 
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 
                    }}>
                      {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''}
                    </span>
                  )}
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Mostrando {registrosPaginados.length} de {registrosOrdenados.length} colaboradores
                  {registrosOrdenados.length !== vacinacoes.length && ` (${vacinacoes.length} total)`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,.2)', padding: 4, borderRadius: 8 }}>
                {(['Todos', 'Atrasados', 'Sem H1N1'] as const).map((f) => (
                  <button
                    key={f} onClick={() => setFiltroTabela(f)}
                    style={{
                      padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                      border: 'none', cursor: 'pointer', transition: 'all .2s',
                      background: filtroTabela === f ? 'rgba(255,255,255,.1)' : 'transparent',
                      color: filtroTabela === f ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRA DE PESQUISA E SELECTS CUSTOMIZADOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 2fr auto', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', top: 11, left: 12 }} />
                <input
                  placeholder="Buscar colaborador por nome..."
                  value={buscaNome}
                  onChange={(e) => setBuscaNome(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,.04)',
                    border: '1px solid var(--border-subtle)', borderRadius: 8,
                    padding: '9px 12px 9px 36px', fontSize: 12, color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <FilterDropdown label="Área" value={filtroArea} options={['Todas', 'ADM', 'PONTA']} onChange={setFiltroArea} />
              <FilterDropdown label="Contrato" value={filtroContrato} options={contratosUnicos} onChange={setFiltroContrato} />
              <FilterDropdown label="Unidade" value={filtroUnidade} options={unidadesUnicas} onChange={setFiltroUnidade} />

              <div style={{ display: 'flex', gap: 8 }}>
                {filtrosAtivos > 0 && (
                  <button
                    onClick={limparFiltros}
                    style={{
                      background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
                      color: 'var(--red)', padding: '8px 12px', borderRadius: 8,
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s'
                    }}
                    title="Limpar todos os filtros"
                  >
                    <FilterX size={14} />
                  </button>
                )}
                
                <button
                  onClick={exportarParaExcel}
                  style={{
                    background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)',
                    color: 'var(--green)', padding: '8px 12px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s'
                  }}
                  title="Exportar para CSV"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.25)' }}>
                  {[
                    { label: 'Colaborador', key: 'nome' },
                    { label: 'Área', key: 'area' },
                    { label: 'Contrato', key: 'contrato' },
                    { label: 'H1N1', key: 'h1n1' },
                    { label: '1ª Dose', key: '1dose' },
                    { label: '2ª Dose', key: '2dose' },
                    { label: 'Ações', key: '' }
                  ].map(({ label, key }) => (
                    <th 
                      key={label} onClick={() => key && handleSort(key)}
                      style={{ 
                        padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, 
                        letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--text-muted)', 
                        whiteSpace: 'nowrap', cursor: key ? 'pointer' : 'default', userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {label}
                        {key && <SortIcon coluna={key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>Carregando dados...</td></tr>}
                {!loading && registrosPaginados.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>Nenhum registro encontrado para estes filtros.</td></tr>}
                
                {registrosPaginados.map((v, idx) => (
                  <motion.tr
                    key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                    style={{ 
                      borderTop: '1px solid var(--border-subtle)', transition: 'background .12s',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.035)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)')}
                  >
                    <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {v.colaboradorName} <br/> <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.unidade}</span>
                    </td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.area} /></td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{v.contrato || '—'}</td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.statusH1N1} /></td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.status1Dose} /></td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={v.status2Dose} /></td>
                    <td style={{ padding: '13px 20px' }}>
                      <button
                        onClick={() => handleEditClick(v)}
                        style={{
                          background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)',
                          color: 'var(--cyan)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, transition: 'all .2s'
                        }}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINAÇÃO ─── */}
          {totalPaginas > 1 && (
            <div style={{ 
              padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Itens por página:</span>
                <select
                  value={itensPorPagina}
                  onChange={(e) => setItensPorPagina(Number(e.target.value))}
                  style={{
                    background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)',
                    borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  style={{
                    padding: '6px 12px', fontSize: 11, borderRadius: 6,
                    border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,.04)',
                    color: 'var(--text-primary)', cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                    opacity: paginaAtual === 1 ? 0.5 : 1
                  }}
                >
                  Anterior
                </button>

                <span style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                  Página {paginaAtual} de {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    padding: '6px 12px', fontSize: 11, borderRadius: 6,
                    border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,.04)',
                    color: 'var(--text-primary)', cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                    opacity: paginaAtual === totalPaginas ? 0.5 : 1
                  }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      {/* ─── MODAL DE EDIÇÃO ─── */}
      <AnimatePresence>
        {editingItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--bg-sidebar)', border: '1px solid var(--border-active)',
                borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Editar Status</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editingItem.colaboradorName} • {editingItem.unidade}</p>
                </div>
                <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Select
                  label="Área" value={editForm.area}
                  onChange={(e) => setEditForm(p => ({ ...p, area: e.target.value }))}
                  options={[{ value: 'PONTA', label: 'PONTA' }, { value: 'ADM', label: 'ADM' }]}
                />
                <Select
                  label="H1N1" value={editForm.statusH1N1}
                  onChange={(e) => setEditForm(p => ({ ...p, statusH1N1: e.target.value }))}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="1ª Dose" value={editForm.status1Dose}
                  onChange={(e) => setEditForm(p => ({ ...p, status1Dose: e.target.value }))}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="2ª Dose" value={editForm.status2Dose}
                  onChange={(e) => setEditForm(p => ({ ...p, status2Dose: e.target.value }))}
                  options={STATUS_OPTIONS}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                  <Button variant="primary" loading={isSaving} onClick={handleSaveEdit}>Salvar Alterações</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
