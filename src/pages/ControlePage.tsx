import React, { useState, useMemo } from 'react'
import { Search, Pencil, X, CheckCircle2, Building2, BriefcaseMedical, Users, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'

import { useDashboard } from '@/hooks/useDashboard'
import { atualizarVacinacao } from '@/api/monday'
import type { VacinacaoItem, VacinaStatus } from '@/types'

const STATUS_OPTIONS = [
  { value: 'Em dia', label: 'Em dia' },
  { value: '1ª dose (Aguard. 2ª)', label: '1ª dose (Aguard. 2ª)' },
  { value: '2ª Dose', label: '2ª Dose' },
  { value: '2ª Dose (Aguard. 3ª)', label: '2ª Dose (Aguard. 3ª)' },
  { value: 'Aguard. Reforço (10 anos)', label: 'Aguard. Reforço (10 anos)' },
  { value: 'Atrasada', label: 'Atrasada' },
  { value: 'Não tomou', label: 'Não tomou' },
  { value: 'Não se aplica', label: 'Não se aplica' },
  { value: 'Em Análise', label: 'Em Análise' },
]

const FAIXAS_ETARIAS = [
  { value: 'Todas', label: 'Todas as idades' },
  { value: '10-24', label: '10 a 24 anos (Jovens)' },
  { value: '25-59', label: '25 a 59 anos (Adultos)' },
  { value: '60+', label: '60+ anos (Idosos)' },
]

function SuccessToast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} style={{ position: 'fixed', top: 32, left: '50%', zIndex: 9999, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '12px 24px', borderRadius: 10, boxShadow: '0 10px 40px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
          <CheckCircle2 size={20} />{message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FilterDropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const click = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])
  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 140 }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '9px 14px', fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, transition: 'all .2s', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}:</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{value}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }}>▼</motion.span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--bg-sidebar)', border: '1px solid var(--border-active)', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: 4, minWidth: 180 }}>
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

function isFaixaEtaria(idade: number, faixa: string): boolean {
  if (faixa === 'Todas' || !faixa) return true
  if (faixa === '10-24') return idade >= 10 && idade <= 24
  if (faixa === '25-59') return idade >= 25 && idade <= 59
  if (faixa === '60+') return idade >= 60
  return true
}

export function ControlePage() {
  const { vacinacoes, refetch } = useDashboard()

  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'PONTA' | 'ADM'>('GERAL')
  const [buscaNome, setBuscaNome] = useState('')
  const [filtroContrato, setFiltroContrato] = useState('Todos')
  const [filtroUnidade, setFiltroUnidade] = useState('Todas')
  const [filtroTabela, setFiltroTabela] = useState<string>('Todos')
  const [filtroIdade, setFiltroIdade] = useState('Todas')
  const [filtroCargo, setFiltroCargo] = useState('Todos')

  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(25)
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
      if (buscaNome && !v.colaboradorName.toLowerCase().includes(buscaNome.toLowerCase())) return false

      // Filtro por Contrato (só PONTA)
      if (v.area === 'PONTA' && filtroContrato !== 'Todos' && v.contrato !== filtroContrato) return false
      // Filtro por Setor (só ADM — contrato guarda o setor)
      if (v.area === 'ADM' && filtroContrato !== 'Todos' && v.contrato !== filtroContrato) return false
      // Filtro por Unidade (só PONTA)
      if (filtroUnidade !== 'Todas' && v.unidade !== filtroUnidade) return false
      // Filtro por Cargo
      if (filtroCargo !== 'Todos' && v.cargo !== filtroCargo) return false
      // Filtro por Faixa Etária
      if (!isFaixaEtaria(v.idade ?? 0, filtroIdade)) return false

      return true
    })
  }, [baseAba, filtroTabela, buscaNome, filtroContrato, filtroUnidade, filtroCargo, filtroIdade])

  const totalPaginas = Math.ceil(registrosFiltrados.length / itensPorPagina)
  const registrosPaginados = useMemo(() => registrosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina), [registrosFiltrados, paginaAtual, itensPorPagina])

  const resetFiltros = () => {
    setFiltroContrato('Todos')
    setFiltroUnidade('Todas')
    setFiltroIdade('Todas')
    setFiltroCargo('Todos')
  }

  React.useEffect(() => { setPaginaAtual(1) }, [buscaNome, abaAtiva, filtroContrato, filtroUnidade, filtroTabela, filtroCargo, filtroIdade])
  React.useEffect(() => { resetFiltros() }, [abaAtiva])

  const activeFiltersCount = [
    filtroContrato !== 'Todos',
    filtroUnidade !== 'Todas',
    filtroIdade !== 'Todas',
    filtroCargo !== 'Todos',
  ].filter(Boolean).length

  const showContrato = abaAtiva === 'PONTA' || abaAtiva === 'GERAL'
  const showSetor = abaAtiva === 'ADM' || abaAtiva === 'GERAL'
  const showUnidade = abaAtiva === 'PONTA'

  return (
    <>
      <SuccessToast show={showToast} message="Dados sincronizados com o Monday!" />
      <Header title="Controle Nominal" subtitle="Gestão, edição e exportação de colaboradores" onRefresh={refetch} />

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

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Controle Nominal
                  {activeFiltersCount > 0 && (
                    <span style={{ fontSize: 10, background: 'var(--cyan)', color: '#000', padding: '2px 7px', borderRadius: 20, marginLeft: 10, fontWeight: 700 }}>
                      {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mostrando {registrosPaginados.length} de {registrosFiltrados.length} encontrados na busca</p>
              </div>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,.2)', padding: 4, borderRadius: 8 }}>
                {(['Todos', 'Atrasados', 'Incompletos'] as const).map((f) => (
                  <button key={f} onClick={() => setFiltroTabela(f)} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: filtroTabela === f ? 'rgba(255,255,255,.1)' : 'transparent', color: filtroTabela === f ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'background .2s' }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Linha 1: Busca + Filtros Rápidos */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', top: 11, left: 12 }} />
                <input placeholder="Buscar colaborador..." value={buscaNome} onChange={(e) => setBuscaNome(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '9px 12px 9px 36px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
              </div>

              {/* Contrato — só PONTA */}
              {showContrato && abaAtiva === 'PONTA' && (
                <FilterDropdown label="Contrato" value={filtroContrato} options={contratosUnicos} onChange={setFiltroContrato} />
              )}

              {/* Setor — só ADM */}
              {showSetor && abaAtiva === 'ADM' && (
                <FilterDropdown label="Setor" value={filtroContrato} options={setoresUnicos} onChange={setFiltroContrato} />
              )}

              {/* Contrato + Setor — visão GERAL (mostra ambos separados) */}
              {abaAtiva === 'GERAL' && (
                <>
                  <FilterDropdown label="Contrato" value={filtroContrato} options={contratosUnicos} onChange={setFiltroContrato} />
                </>
              )}

              {/* Unidade — só PONTA */}
              {showUnidade && (
                <FilterDropdown label="Unidade" value={filtroUnidade} options={unidadesUnicas} onChange={setFiltroUnidade} />
              )}

              {/* Cargo — sempre */}
              <FilterDropdown label="Função" value={filtroCargo} options={cargosUnicos} onChange={setFiltroCargo} />

              {/* Faixa Etária — sempre */}
              <FilterDropdown label="Idade" value={FAIXAS_ETARIAS.find(f => f.value === filtroIdade)?.label ?? filtroIdade} options={FAIXAS_ETARIAS.map(f => f.label)} onChange={(label) => {
                const found = FAIXAS_ETARIAS.find(f => f.label === label)
                if (found) setFiltroIdade(found.value)
              }} />

              {activeFiltersCount > 0 && (
                <button onClick={resetFiltros} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Badges de filtros ativos */}
            {activeFiltersCount > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {filtroContrato !== 'Todos' && <ActiveFilterBadge label={filtroContrato} onRemove={() => setFiltroContrato('Todos')} />}
                {filtroUnidade !== 'Todas' && <ActiveFilterBadge label={filtroUnidade} onRemove={() => setFiltroUnidade('Todas')} />}
                {filtroCargo !== 'Todos' && <ActiveFilterBadge label={filtroCargo} onRemove={() => setFiltroCargo('Todos')} />}
                {filtroIdade !== 'Todas' && <ActiveFilterBadge label={FAIXAS_ETARIAS.find(f => f.value === filtroIdade)?.label ?? filtroIdade} onRemove={() => setFiltroIdade('Todas')} />}
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.25)' }}>
                  {['Colaborador', 'Área', 'Hepatite B', 'Dupla (dT)', 'Tríp. Viral', 'F. Amarela', 'Influenza', 'Pneumo 23', 'H. Zóster', 'COVID-19', 'Ações'].map((label) => (
                    <th key={label} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {label}
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
                      {v.colaboradorName}
                      <br />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {v.idade ? `${v.idade} anos • ` : ''}{v.cargo}
                      </span>
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
                      <button onClick={() => { setEditingItem(v); setEditForm({ ...v }); }} style={{ background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)', color: 'var(--cyan)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
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

      {/* ─── MODAL DE EDIÇÃO ─── */}
      <AnimatePresence>
        {editingItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-active)', borderRadius: 16, width: '100%', maxWidth: 700, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
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
                      <input value={editForm.colaboradorName} onChange={(e) => setEditForm((p: any) => ({ ...p, colaboradorName: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>

                    <Select label="Área" value={editForm.area} onChange={(e) => setEditForm((p: any) => ({ ...p, area: e.target.value }))} options={[{ value: 'PONTA', label: 'PONTA' }, { value: 'ADM', label: 'ADM' }]} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Função / Cargo</label>
                      <input value={editForm.cargo} onChange={(e) => setEditForm((p: any) => ({ ...p, cargo: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{editForm.area === 'ADM' ? 'Setor' : 'Contrato'}</label>
                      <input value={editForm.contrato} onChange={(e) => setEditForm((p: any) => ({ ...p, contrato: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>

                    {editForm.area === 'PONTA' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unidade</label>
                        <input value={editForm.unidade} onChange={(e) => setEditForm((p: any) => ({ ...p, unidade: e.target.value }))} style={{ background: 'rgba(14,18,20,.95)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                    )}
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle)' }} />

                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 12 }}>Status Vacinal</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Select label="Hepatite B" value={editForm.statusHepatiteB} onChange={(e) => setEditForm((p: any) => ({ ...p, statusHepatiteB: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Dupla Adulta (dT)" value={editForm.statusDuplaAdulta} onChange={(e) => setEditForm((p: any) => ({ ...p, statusDuplaAdulta: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Tríplice Viral" value={editForm.statusTripliceViral} onChange={(e: any) => setEditForm((p: any) => ({ ...p, statusTripliceViral: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Febre Amarela" value={editForm.statusFebreAmarela} onChange={(e) => setEditForm((p: any) => ({ ...p, statusFebreAmarela: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Influenza (Gripe)" value={editForm.statusInfluenza} onChange={(e: any) => setEditForm((p: any) => ({ ...p, statusInfluenza: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Pneumocócica 23" value={editForm.statusPneumococica} onChange={(e) => setEditForm((p: any) => ({ ...p, statusPneumococica: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="Herpes Zóster" value={editForm.statusHerpesZoster} onChange={(e) => setEditForm((p: any) => ({ ...p, statusHerpesZoster: e.target.value }))} options={STATUS_OPTIONS} />
                    <Select label="COVID-19" value={editForm.statusH1N1} onChange={(e) => setEditForm((p: any) => ({ ...p, statusH1N1: e.target.value }))} options={STATUS_OPTIONS} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                <Button variant="primary" loading={isSaving} onClick={async () => {
                  setIsSaving(true)
                  try {
                    const isADM = editForm.area === 'ADM'
                    await atualizarVacinacao(editingItem.boardId, editingItem.id, isADM, editForm)
                    setEditingItem(null); setShowToast(true); setTimeout(() => setShowToast(false), 3000); refetch()
                  } catch (e: any) {
                    console.error('Erro no salvamento:', e)
                    alert('Erro no salvamento: ' + (e.message || 'Erro desconhecido'))
                  } finally { setIsSaving(false) }
                }}>Salvar Alterações</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
