import React, { useState, useMemo } from 'react'
import { Users, AlertTriangle, Search, Pencil, X, CheckCircle2, Building2, BriefcaseMedical, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList } from 'recharts'

import { Header } from '@/components/layout/Header'
import { KPICard } from '@/components/dashboard/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'

import { useDashboard } from '@/hooks/useDashboard'
import { atualizarVacinacao } from '@/api/monday'
import type { VacinacaoItem } from '@/types'

const STATUS_OPTIONS = [
  { value: 'Em dia', label: 'Em dia' },
  { value: '1ª Dose', label: '1ª Dose' },
  { value: '2ª Dose', label: '2ª Dose' },
  { value: 'Aguard. Reforço', label: 'Aguard. Reforço' },
  { value: 'Atrasada', label: 'Atrasada' },
  { value: 'Não tomou', label: 'Não tomou' },
  { value: 'Não se aplica', label: 'Não se aplica' },
  { value: 'Em Análise', label: 'Em Análise' },
]

const FAIXAS_ETARIAS = [
  { value: 'Todas', label: 'Todas as idades' },
  { value: '10-24', label: '10–24 anos (Jovens)' },
  { value: '25-59', label: '25–59 anos (Adultos)' },
  { value: '60+', label: '60+ anos (Idosos)' },
]

function isFaixaEtaria(idade: number, faixa: string): boolean {
  if (faixa === 'Todas') return true
  if (faixa === '10-24') return idade >= 10 && idade <= 24
  if (faixa === '25-59') return idade >= 25 && idade <= 59
  if (faixa === '60+') return idade >= 60
  return true
}

// ─── Gráfico de Barras: Doses em Atraso por Vacina ───

function DoseChartEnhanced({ itens, loading, onClick, activeBar }: { itens: VacinacaoItem[]; loading: boolean; onClick?: (v: string) => void; activeBar?: string | null }) {
  const pendencias = ['Atrasada', 'Não tomou']
  const data = [
    { name: 'Hepatite B', value: itens.filter(v => pendencias.includes(v.statusHepatiteB)).length, color: '#F59E0B' },
    { name: 'Dupla (dT)', value: itens.filter(v => pendencias.includes(v.statusDuplaAdulta)).length, color: '#EF4444' },
    { name: 'T. Viral', value: itens.filter(v => pendencias.includes(v.statusTripliceViral)).length, color: '#A78BFA' },
    { name: 'F. Amarela', value: itens.filter(v => pendencias.includes(v.statusFebreAmarela)).length, color: '#3B82F6' },
    { name: 'Influenza', value: itens.filter(v => pendencias.includes(v.statusInfluenza)).length, color: '#10B981' },
    { name: 'Pneumo 23', value: itens.filter(v => pendencias.includes(v.statusPneumococica)).length, color: '#F472B6' },
    { name: 'H. Zóster', value: itens.filter(v => pendencias.includes(v.statusHerpesZoster)).length, color: '#8B5CF6' },
    { name: 'COVID-19', value: itens.filter(v => pendencias.includes(v.statusH1N1)).length, color: '#00E5FF' },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Pendências por Vacina</p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>👆 Clique em uma barra para filtrar a tabela</p>
        </div>
        {activeBar && (
          <button onClick={() => onClick?.('')} style={{ background: 'transparent', border: '1px solid var(--border-active)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--cyan)', cursor: 'pointer' }}>
            Limpar Filtro
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={26} onClick={(d) => { if (d?.activePayload) onClick?.(d.activePayload[0].payload.name) }} style={{ cursor: 'pointer' }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v: number) => [`${v} colaboradores`, 'Pendentes']} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} fillOpacity={loading ? 0.3 : (activeBar && activeBar !== d.name ? 0.2 : 0.88)} style={{ transition: 'all 0.3s ease' }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Gráfico de Pizza: Distribuição Global de Status ───

function StatusDistributionChartEnhanced({ itens, loading }: { itens: VacinacaoItem[]; loading: boolean }) {
  const data = useMemo(() => {
    let emDia = 0, aguardando = 0, andamento = 0, atrasado = 0, naoSeAplica = 0, emAnalise = 0
    itens.forEach(v => {
      const statuses = [v.statusHepatiteB, v.statusDuplaAdulta, v.statusTripliceViral, v.statusFebreAmarela, v.statusInfluenza, v.statusPneumococica, v.statusHerpesZoster, v.statusH1N1] as string[]
      statuses.forEach(s => {
        if (s === 'Em dia') emDia++
        else if (s === 'Aguard. Reforço' || s === 'Aguard. Reforço (10 anos)') aguardando++
        else if (s?.includes('Dose')) andamento++
        else if (s === 'Atrasada' || s === 'Não tomou') atrasado++
        else if (s === 'Não se aplica') naoSeAplica++
        else if (s === 'Em Análise') emAnalise++
      })
    })
    return [
      { name: 'Em dia', value: emDia, color: '#10B981' },
      { name: 'Aguard. Reforço', value: aguardando, color: '#818CF8' },
      { name: 'Em andamento', value: andamento, color: '#22D3EE' },
      { name: 'Pendente', value: atrasado, color: '#EF4444' },
      { name: 'Em Análise', value: emAnalise, color: '#F59E0B' },
      { name: 'N/A', value: naoSeAplica, color: '#6B7280' },
    ].filter(d => d.value > 0)
  }, [itens])

  const RADIAN = Math.PI / 180
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700 }}>{`${(percent * 100).toFixed(0)}%`}</text>
  }

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Distribuição de Status Vacinal</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Visão proporcional de todos os status</p>
      {loading ? (
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0} labelLine={false} label={renderLabel}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v: number) => [`${v} doses`, '']} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Gráfico de Distribuição por Faixa Etária ───

function AgeDistributionChart({ itens, loading }: { itens: VacinacaoItem[]; loading: boolean }) {
  const data = useMemo(() => {
    const counts = { '10–24 anos': 0, '25–39 anos': 0, '40–59 anos': 0, '60+ anos': 0 }
    itens.forEach(v => {
      const idade = v.idade ?? 0
      if (idade >= 10 && idade <= 24) counts['10–24 anos']++
      else if (idade >= 25 && idade <= 39) counts['25–39 anos']++
      else if (idade >= 40 && idade <= 59) counts['40–59 anos']++
      else if (idade >= 60) counts['60+ anos']++
    })
    return [
      { name: '10–24', label: '10–24 anos', value: counts['10–24 anos'], color: '#22D3EE' },
      { name: '25–39', label: '25–39 anos', value: counts['25–39 anos'], color: '#10B981' },
      { name: '40–59', label: '40–59 anos', value: counts['40–59 anos'], color: '#A78BFA' },
      { name: '60+', label: '60+ anos', value: counts['60+ anos'], color: '#F59E0B' },
    ]
  }, [itens])

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Distribuição por Faixa Etária</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Quantidade de colaboradores por idade</p>
      {loading ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={36} layout="vertical">
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.05)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={40} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v: number, _: string, props: any) => [`${v} colaboradores`, props.payload.label]} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
              {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Gráfico Top Cargos com Pendências ───

function TopCargosChart({ itens, loading }: { itens: VacinacaoItem[]; loading: boolean }) {
  const data = useMemo(() => {
    const pendencias = ['Atrasada', 'Não tomou']
    const cargoMap: Record<string, number> = {}
    itens.forEach(v => {
      const cargo = v.cargo?.trim()
      if (!cargo) return
      const todasAsVacinas = [v.statusHepatiteB, v.statusDuplaAdulta, v.statusTripliceViral, v.statusFebreAmarela, v.statusInfluenza, v.statusPneumococica, v.statusHerpesZoster, v.statusH1N1]
      if (todasAsVacinas.some(s => pendencias.includes(s))) {
        cargoMap[cargo] = (cargoMap[cargo] ?? 0) + 1
      }
    })
    return Object.entries(cargoMap)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [itens])

  const colors = ['#EF4444', '#F59E0B', '#A78BFA', '#10B981', '#3B82F6', '#F472B6']

  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, height: '100%' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Funções com Mais Pendências</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Top funções com vacinas atrasadas/não tomadas</p>
      {loading ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          🎉 Nenhuma pendência encontrada!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28} layout="vertical">
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.05)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={100} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v: number) => [`${v} colaboradores`, 'Pendentes']} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Componentes auxiliares ───

function SuccessToast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} style={{ position: 'fixed', top: 32, left: '50%', zIndex: 9999, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '12px 24px', borderRadius: 10, boxShadow: '0 10px 40px rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
          <CheckCircle2 size={20} />{message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FilterDropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 140 }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '9px 14px', fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}:</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{value}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }}>▼</motion.span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--bg-sidebar)', border: '1px solid var(--border-active)', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,.5)', padding: 4, minWidth: 180 }}>
            {options.map((o: string) => (
              <div key={o} onClick={() => { onChange(o); setIsOpen(false) }} style={{ padding: '10px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6, color: value === o ? 'var(--cyan)' : 'var(--text-primary)', background: value === o ? 'rgba(0,229,255,.05)' : 'transparent', whiteSpace: 'nowrap' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')} onMouseLeave={e => (e.currentTarget.style.background = value === o ? 'rgba(0,229,255,.05)' : 'transparent')}>{o}</div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.25)', borderRadius: 20, padding: '3px 10px 3px 8px', fontSize: 11, color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
      <Filter size={10} />
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', padding: 0, fontSize: 13, lineHeight: 1, marginLeft: 2 }}>×</button>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ───

export function DashboardPage() {
  const { stats, vacinacoes, loading, refetch } = useDashboard()

  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'PONTA' | 'ADM'>('GERAL')
  const [buscaNome, setBuscaNome] = useState('')
  const [filtroContrato, setFiltroContrato] = useState('Todos')
  const [filtroUnidade, setFiltroUnidade] = useState('Todas')
  const [filtroTabela, setFiltroTabela] = useState<string>('Todos')
  const [filtroIdade, setFiltroIdade] = useState('Todas')
  const [filtroCargo, setFiltroCargo] = useState('Todos')

  const [filtroKpi, setFiltroKpi] = useState<'REGULARES' | 'PENDENCIAS' | null>(null)
  const [filtroGraficoVacina, setFiltroGraficoVacina] = useState<string | null>(null)

  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(25)
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({ coluna: '', direcao: 'asc' })

  const [editingItem, setEditingItem] = useState<VacinacaoItem | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const baseAba = useMemo(() => {
    if (abaAtiva === 'PONTA') return vacinacoes.filter(v => v.area === 'PONTA')
    if (abaAtiva === 'ADM') return vacinacoes.filter(v => v.area === 'ADM')
    return vacinacoes
  }, [vacinacoes, abaAtiva])

  const contratosUnicos = useMemo(() => ['Todos', ...new Set(baseAba.filter(v => v.area === 'PONTA').map(v => v.contrato).filter(Boolean))].sort(), [baseAba])
  const setoresUnicos = useMemo(() => ['Todos', ...new Set(baseAba.filter(v => v.area === 'ADM').map(v => v.contrato).filter(Boolean))].sort(), [baseAba])
  const unidadesUnicas = useMemo(() => ['Todas', ...new Set(baseAba.filter(v => v.area === 'PONTA').map(v => v.unidade).filter(Boolean))].sort(), [baseAba])
  const cargosUnicos = useMemo(() => ['Todos', ...new Set(baseAba.map(v => v.cargo).filter(Boolean))].sort(), [baseAba])

  const registrosFiltrados = useMemo(() => {
    return baseAba.filter(v => {
      const pendencias = ['Atrasada', 'Não tomou']
      const emAndamento = ['1ª Dose', '2ª Dose', 'Aguard. Reforço']
      const todasAsVacinas = [v.statusHepatiteB, v.statusDuplaAdulta, v.statusTripliceViral, v.statusFebreAmarela, v.statusInfluenza, v.statusPneumococica, v.statusHerpesZoster, v.statusH1N1]

      if (filtroTabela === 'Atrasados' && !todasAsVacinas.some(s => pendencias.includes(s))) return false
      if (filtroTabela === 'Incompletos' && !todasAsVacinas.some(s => emAndamento.includes(s))) return false
      if (filtroKpi === 'REGULARES' && todasAsVacinas.some(s => pendencias.includes(s))) return false
      if (filtroKpi === 'PENDENCIAS' && !todasAsVacinas.some(s => pendencias.includes(s))) return false

      if (filtroGraficoVacina) {
        const mapa: Record<string, string> = {
          'Hepatite B': v.statusHepatiteB, 'Dupla (dT)': v.statusDuplaAdulta, 'T. Viral': v.statusTripliceViral,
          'F. Amarela': v.statusFebreAmarela, 'Influenza': v.statusInfluenza, 'Pneumo 23': v.statusPneumococica,
          'H. Zóster': v.statusHerpesZoster, 'COVID-19': v.statusH1N1,
        }
        if (!pendencias.includes(mapa[filtroGraficoVacina])) return false
      }

      if (buscaNome && !v.colaboradorName.toLowerCase().includes(buscaNome.toLowerCase())) return false

      if (v.area === 'PONTA' && filtroContrato !== 'Todos' && v.contrato !== filtroContrato) return false
      if (v.area === 'ADM' && filtroContrato !== 'Todos' && v.contrato !== filtroContrato) return false
      if (filtroUnidade !== 'Todas' && v.unidade !== filtroUnidade) return false
      if (filtroCargo !== 'Todos' && v.cargo !== filtroCargo) return false
      if (!isFaixaEtaria(v.idade ?? 0, filtroIdade)) return false

      return true
    })
  }, [baseAba, filtroTabela, filtroKpi, filtroGraficoVacina, buscaNome, filtroContrato, filtroUnidade, filtroCargo, filtroIdade])

  const statsAba = useMemo(() => {
    if (!stats) return null
    let atrasosTotais = 0, regularTotais = 0
    baseAba.forEach(v => {
      const pendencias = ['Atrasada', 'Não tomou']
      const isRegular = !pendencias.includes(v.statusHepatiteB) && !pendencias.includes(v.statusDuplaAdulta) && !pendencias.includes(v.statusTripliceViral) && !pendencias.includes(v.statusFebreAmarela) && !pendencias.includes(v.statusInfluenza) && !pendencias.includes(v.statusPneumococica) && !pendencias.includes(v.statusHerpesZoster) && !pendencias.includes(v.statusH1N1)
      if (isRegular) regularTotais++
      else atrasosTotais++
    })
    return { ...stats, totalAba: baseAba.length, regularesAba: regularTotais, atrasosAba: atrasosTotais } as any
  }, [stats, abaAtiva, baseAba])

  const registrosOrdenados = useMemo(() => {
    if (!ordenacao.coluna) return registrosFiltrados
    return [...registrosFiltrados].sort((a: any, b: any) => {
      const aVal = String(a[ordenacao.coluna] || '').toLowerCase()
      const bVal = String(b[ordenacao.coluna] || '').toLowerCase()
      if (aVal < bVal) return ordenacao.direcao === 'asc' ? -1 : 1
      if (aVal > bVal) return ordenacao.direcao === 'asc' ? 1 : -1
      return 0
    })
  }, [registrosFiltrados, ordenacao])

  const totalPaginas = Math.ceil(registrosOrdenados.length / itensPorPagina)
  const registrosPaginados = useMemo(() => registrosOrdenados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina), [registrosOrdenados, paginaAtual, itensPorPagina])

  const resetFiltros = () => { setFiltroContrato('Todos'); setFiltroUnidade('Todas'); setFiltroIdade('Todas'); setFiltroCargo('Todos'); setFiltroGraficoVacina(null); setFiltroKpi(null) }

  React.useEffect(() => { setPaginaAtual(1) }, [buscaNome, abaAtiva, filtroContrato, filtroUnidade, filtroTabela, filtroKpi, filtroGraficoVacina, filtroCargo, filtroIdade])
  React.useEffect(() => { resetFiltros() }, [abaAtiva])

  const handleSort = (coluna: string) => setOrdenacao({ coluna, direcao: ordenacao.coluna === coluna && ordenacao.direcao === 'asc' ? 'desc' : 'asc' })

  const handleSaveEdit = async () => {
    if (!editingItem) return
    setIsSaving(true)
    try {
      await atualizarVacinacao(editingItem.boardId, editingItem.id, editForm.area === 'ADM', editForm)
      setEditingItem(null); setShowToast(true); setTimeout(() => setShowToast(false), 3000); refetch()
    } catch (e: any) {
      alert('Erro: ' + (e.message || 'Erro desconhecido'))
    } finally { setIsSaving(false) }
  }

  const activeFiltersCount = [filtroContrato !== 'Todos', filtroUnidade !== 'Todas', filtroIdade !== 'Todas', filtroCargo !== 'Todos', !!filtroKpi, !!filtroGraficoVacina].filter(Boolean).length

  return (
    <>
      <SuccessToast show={showToast} message="Dados sincronizados com o Monday!" />
      <Header title="Dashboard Analítico" subtitle="Visão geral e gráficos" onRefresh={refetch} />

      <div className="content-padding" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 28 }}>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          {(['GERAL', 'PONTA', 'ADM'] as const).map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', transition: 'all .2s', background: abaAtiva === aba ? 'rgba(0,229,255,.15)' : 'transparent', color: abaAtiva === aba ? 'var(--cyan)' : 'var(--text-secondary)', border: abaAtiva === aba ? '1px solid rgba(0,229,255,.3)' : '1px solid transparent' }}>
              {aba === 'GERAL' && <Building2 size={14} style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />}
              {aba === 'PONTA' && <BriefcaseMedical size={14} style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />}
              {aba === 'ADM' && <Users size={14} style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />}
              {aba === 'GERAL' ? 'Visão Corporativa' : `Somente ${aba}`}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          <KPICard label="Total de Registros" value={loading ? '—' : (statsAba?.totalAba ?? 0)} icon={Users} color="#9CA3AF" loading={loading} onClick={() => { setFiltroKpi(null); setFiltroGraficoVacina(null) }} isActive={filtroKpi === null && filtroGraficoVacina === null} />
          <KPICard label="Imunização Completa" value={loading ? '—' : (statsAba?.regularesAba ?? 0)} icon={CheckCircle2} color="#10B981" loading={loading} trend={statsAba?.totalAba ? `${Math.round((statsAba.regularesAba / statsAba.totalAba) * 100)}% de cobertura` : undefined} trendUp onClick={() => setFiltroKpi(filtroKpi === 'REGULARES' ? null : 'REGULARES')} isActive={filtroKpi === 'REGULARES'} />
          <KPICard label="Pendências Mapeadas" value={loading ? '—' : (statsAba?.atrasosAba ?? 0)} icon={AlertTriangle} color="#EF4444" loading={loading} trend={statsAba?.totalAba ? `${Math.round((statsAba.atrasosAba / statsAba.totalAba) * 100)}% da equipe` : undefined} trendUp={false} onClick={() => setFiltroKpi(filtroKpi === 'PENDENCIAS' ? null : 'PENDENCIAS')} isActive={filtroKpi === 'PENDENCIAS'} />
        </section>

        {/* Gráficos — linha 1 */}
        <section className="charts-grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          <DoseChartEnhanced itens={baseAba} loading={loading} onClick={(v) => { setFiltroGraficoVacina(v || null); setFiltroKpi(null) }} activeBar={filtroGraficoVacina} />
          <StatusDistributionChartEnhanced itens={baseAba} loading={loading} />
        </section>

        {/* Gráficos — linha 2 (novos) */}
        <section className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <AgeDistributionChart itens={baseAba} loading={loading} />
          <TopCargosChart itens={baseAba} loading={loading} />
        </section>

        {/* Tabela Nominal */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Controle Nominal
                  {activeFiltersCount > 0 && <span style={{ fontSize: 10, background: 'var(--cyan)', color: '#000', padding: '2px 7px', borderRadius: 20, marginLeft: 10, fontWeight: 700 }}>{activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}</span>}
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mostrando {registrosPaginados.length} de {registrosFiltrados.length} encontrados</p>
              </div>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,.2)', padding: 4, borderRadius: 8 }}>
                {(['Todos', 'Atrasados', 'Incompletos'] as const).map(f => (
                  <button key={f} onClick={() => setFiltroTabela(f)} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: filtroTabela === f ? 'rgba(255,255,255,.1)' : 'transparent', color: filtroTabela === f ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'background .2s' }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
                <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', top: 11, left: 12 }} />
                <input placeholder="Buscar colaborador..." value={buscaNome} onChange={e => setBuscaNome(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '9px 12px 9px 36px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
              </div>

              {abaAtiva === 'PONTA' && <FilterDropdown label="Contrato" value={filtroContrato} options={contratosUnicos} onChange={setFiltroContrato} />}
              {abaAtiva === 'ADM' && <FilterDropdown label="Setor" value={filtroContrato} options={setoresUnicos} onChange={setFiltroContrato} />}
              {abaAtiva === 'GERAL' && <FilterDropdown label="Contrato" value={filtroContrato} options={contratosUnicos} onChange={setFiltroContrato} />}
              {abaAtiva === 'PONTA' && <FilterDropdown label="Unidade" value={filtroUnidade} options={unidadesUnicas} onChange={setFiltroUnidade} />}

              <FilterDropdown label="Função" value={filtroCargo} options={cargosUnicos} onChange={setFiltroCargo} />
              <FilterDropdown
                label="Idade"
                value={FAIXAS_ETARIAS.find(f => f.value === filtroIdade)?.label ?? filtroIdade}
                options={FAIXAS_ETARIAS.map(f => f.label)}
                onChange={(label) => { const f = FAIXAS_ETARIAS.find(x => x.label === label); if (f) setFiltroIdade(f.value) }}
              />

              {activeFiltersCount > 0 && (
                <button onClick={resetFiltros} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                >Limpar filtros</button>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {filtroContrato !== 'Todos' && <ActiveFilterBadge label={filtroContrato} onRemove={() => setFiltroContrato('Todos')} />}
                {filtroUnidade !== 'Todas' && <ActiveFilterBadge label={filtroUnidade} onRemove={() => setFiltroUnidade('Todas')} />}
                {filtroCargo !== 'Todos' && <ActiveFilterBadge label={filtroCargo} onRemove={() => setFiltroCargo('Todos')} />}
                {filtroIdade !== 'Todas' && <ActiveFilterBadge label={FAIXAS_ETARIAS.find(f => f.value === filtroIdade)?.label ?? filtroIdade} onRemove={() => setFiltroIdade('Todas')} />}
                {filtroKpi && <ActiveFilterBadge label={filtroKpi === 'REGULARES' ? 'Em dia' : 'Com pendência'} onRemove={() => setFiltroKpi(null)} />}
                {filtroGraficoVacina && <ActiveFilterBadge label={`Vacina: ${filtroGraficoVacina}`} onRemove={() => setFiltroGraficoVacina(null)} />}
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.25)' }}>
                  {[
                    { label: 'Colaborador', key: 'colaboradorName' }, { label: 'Área', key: 'area' },
                    { label: 'Hepatite B', key: 'statusHepatiteB' }, { label: 'Dupla (dT)', key: 'statusDuplaAdulta' },
                    { label: 'Tríp. Viral', key: 'statusTripliceViral' }, { label: 'F. Amarela', key: 'statusFebreAmarela' },
                    { label: 'Influenza', key: 'statusInfluenza' }, { label: 'Pneumo 23', key: 'statusPneumococica' },
                    { label: 'H. Zóster', key: 'statusHerpesZoster' }, { label: 'COVID-19', key: 'statusH1N1' },
                    { label: 'Ações', key: '' },
                  ].map(({ label, key }) => (
                    <th key={label} onClick={() => key && handleSort(key)} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: key ? 'pointer' : 'default' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {label}
                        {key && ordenacao.coluna === key && (ordenacao.direcao === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : registrosPaginados.map((v, idx) => (
                  <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }} style={{ borderTop: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {v.colaboradorName}<br />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.idade ? `${v.idade} anos • ` : ''}{v.cargo}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.area} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusHepatiteB} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusDuplaAdulta} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusTripliceViral} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusFebreAmarela} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusInfluenza} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusPneumococica} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusHerpesZoster} /></td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={v.statusH1N1} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => { setEditingItem(v); setEditForm({ ...v }) }} style={{ background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)', color: 'var(--cyan)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <Pencil size={12} /> Editar
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Página {paginaAtual} de {totalPaginas} · {registrosFiltrados.length} registros</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,.04)', color: 'var(--text-primary)', cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', opacity: paginaAtual === 1 ? 0.5 : 1 }}>Anterior</button>
                <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,.04)', color: 'var(--text-primary)', cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaAtual === totalPaginas ? 0.5 : 1 }}>Próxima</button>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {editingItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-active)', borderRadius: 16, width: '100%', maxWidth: 700, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Edição Completa</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Atualize dados cadastrais e vacinas do colaborador.</p>
                </div>
                <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 12 }}>Dados do Colaborador</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / span 2' }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Nome Completo</label>
                      <input value={editForm.colaboradorName} onChange={e => setEditForm((p: any) => ({ ...p, colaboradorName: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                    <Select label="Área" value={editForm.area} onChange={e => setEditForm((p: any) => ({ ...p, area: e.target.value }))} options={[{ value: 'PONTA', label: 'PONTA' }, { value: 'ADM', label: 'ADM' }]} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Função / Cargo</label>
                      <input value={editForm.cargo} onChange={e => setEditForm((p: any) => ({ ...p, cargo: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{editForm.area === 'ADM' ? 'Setor' : 'Contrato'}</label>
                      <input value={editForm.contrato} onChange={e => setEditForm((p: any) => ({ ...p, contrato: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                    {editForm.area === 'PONTA' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unidade</label>
                        <input value={editForm.unidade} onChange={e => setEditForm((p: any) => ({ ...p, unidade: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                    )}
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle)' }} />

                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 12 }}>Status Vacinal</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Select label="Hepatite B" value={editForm.statusHepatiteB} onChange={e => setEditForm((p: any) => ({ ...p, statusHepatiteB: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Dupla Adulta (dT)" value={editForm.statusDuplaAdulta} onChange={e => setEditForm((p: any) => ({ ...p, statusDuplaAdulta: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Tríplice Viral" value={editForm.statusTripliceViral} onChange={(e: any) => setEditForm((p: any) => ({ ...p, statusTripliceViral: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Febre Amarela" value={editForm.statusFebreAmarela} onChange={e => setEditForm((p: any) => ({ ...p, statusFebreAmarela: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Influenza (Gripe)" value={editForm.statusInfluenza} onChange={(e: any) => setEditForm((p: any) => ({ ...p, statusInfluenza: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Pneumocócica 23" value={editForm.statusPneumococica} onChange={e => setEditForm((p: any) => ({ ...p, statusPneumococica: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Herpes Zóster" value={editForm.statusHerpesZoster} onChange={e => setEditForm((p: any) => ({ ...p, statusHerpesZoster: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="COVID-19" value={editForm.statusH1N1} onChange={e => setEditForm((p: any) => ({ ...p, statusH1N1: e.target.value }))} options={STATUS_OPTIONS} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                <Button variant="primary" loading={isSaving} onClick={handleSaveEdit}>Salvar Alterações</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
