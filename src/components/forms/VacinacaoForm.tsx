import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { FileDropzone } from '@/components/common/FileDropzone'
import { ZeGotinha } from '@/components/forms/ZeGotinha'
import { SusInstructions } from '@/components/forms/SusInstructions'

import { useColaboradores } from '@/hooks/useColaboradores'
import { criarVacinacao, uploadFile } from '@/api/monday'
import type { FormVacinacaoState } from '@/types'

const STATUS_OPTIONS = [
  { value: 'Em dia', label: 'Em dia ✅' },
  { value: 'Atrasada', label: 'Atrasada ⚠️' },
  { value: 'Não tomou', label: 'Não tomou ❌' },
]

const EMPTY: FormVacinacaoState = {
  colaboradorId: '',
  colaboradorName: '',
  contrato: '',
  contratoCustom: '',
  unidade: '',
  observacao: '',
  statusH1N1: '',
  status1Dose: '',
  status2Dose: '',
  arquivoFisico: null,
  arquivoDigital: null,
}

interface Props { area: 'PONTA' | 'ADM' }

export function VacinacaoForm({ area }: Props) {
  const { colaboradores, contratos, unidades, loading: loadingColab, error: errorColab } = useColaboradores()
  const [form, setForm] = useState<FormVacinacaoState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormVacinacaoState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ESTADOS DO NOVO AUTOCOMPLETE
  const [buscaNome, setBuscaNome] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ESTADOS DO AUTOCOMPLETE DE UNIDADE
  const [showUnidadeDropdown, setShowUnidadeDropdown] = useState(false)
  const unidadeRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof FormVacinacaoState>(k: K, v: FormVacinacaoState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  // Fechar o dropdown ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (unidadeRef.current && !unidadeRef.current.contains(e.target as Node)) {
        setShowUnidadeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar colaboradores enquanto digita
  const colaboradoresFiltrados = useMemo(() => {
    if (!buscaNome.trim()) return colaboradores
    return colaboradores.filter(c =>
      c.name.toLowerCase().includes(buscaNome.toLowerCase())
    )
  }, [colaboradores, buscaNome])

  const handleColabSelect = (id: string, name: string) => {
    const c = colaboradores.find((x) => x.id === id)
    if (!c) return
    setBuscaNome(name) // Atualiza o input com o nome completo
    set('colaboradorId', id)
    set('colaboradorName', name)
    if (c.contrato) set('contrato', c.contrato)
    if (c.unidade) set('unidade', c.unidade)
    setShowDropdown(false) // Esconde a listinha
    setErrors((prev) => ({ ...prev, colaboradorId: undefined })) // Remove erro se houver
  }

  const contratoOptions = useMemo(() => [
    ...contratos.map((c) => ({ value: c, label: c })),
    { value: '__outro__', label: 'Outro (digitar)' },
  ], [contratos])

  // 🌟 NOVO: Lógica de busca inteligente para Unidades (Ignora acentos e prioriza começo)
  const unidadesFiltradas = useMemo(() => {
    const busca = form.unidade.trim().toLowerCase()
    if (!busca) return unidades

    // Função para remover acentos (ex: São -> sao)
    const removeAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const buscaLimpa = removeAcentos(busca)

    return unidades
      .filter(u => removeAcentos(u.toLowerCase()).includes(buscaLimpa))
      .sort((a, b) => {
        const aLimpo = removeAcentos(a.toLowerCase())
        const bLimpo = removeAcentos(b.toLowerCase())

        // Prioridade 1: Unidades que COMEÇAM com a letra digitada ficam no topo
        const aComeca = aLimpo.startsWith(buscaLimpa)
        const bComeca = bLimpo.startsWith(buscaLimpa)

        if (aComeca && !bComeca) return -1
        if (!aComeca && bComeca) return 1

        // Prioridade 2: Ordem alfabética normal
        return a.localeCompare(b)
      })
  }, [unidades, form.unidade])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.colaboradorId) e.colaboradorId = 'Selecione um colaborador da lista'
    if (!form.contrato) e.contrato = 'Selecione o contrato'
    if (form.contrato === '__outro__' && !form.contratoCustom.trim()) e.contratoCustom = 'Digite o contrato'
    if (!form.unidade) e.unidade = 'Selecione a unidade'
    if (!form.statusH1N1) e.statusH1N1 = 'Selecione o status'
    if (!form.status1Dose) e.status1Dose = 'Selecione o status'
    if (!form.status2Dose) e.status2Dose = 'Selecione o status'
    if (!form.arquivoFisico) e.arquivoFisico = 'Obrigatório'
    if (!form.arquivoDigital) e.arquivoDigital = 'Obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const contrato = form.contrato === '__outro__' ? form.contratoCustom.toUpperCase() : form.contrato

      const newItemId = await criarVacinacao({
        colaboradorName: form.colaboradorName,
        colaboradorId: form.colaboradorId,
        contrato,
        unidade: form.unidade,
        area,
        statusH1N1: form.statusH1N1,
        status1Dose: form.status1Dose,
        status2Dose: form.status2Dose,
        observacao: form.observacao,
      })

      // 2. Upload files
      if (newItemId) {
        await Promise.allSettled([
          // Cartão Físico
          form.arquivoFisico && uploadFile(newItemId, 'file_mm27rea', form.arquivoFisico),

          // Cartão Digital SUS
          form.arquivoDigital && uploadFile(newItemId, 'files', form.arquivoDigital),
        ])
      }

      setSuccess(true)
      setForm(EMPTY)
      setBuscaNome('') // Reseta a busca também
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)', borderRadius: 14,
    padding: 28,
  }

  const sectionTitle = (t: string) => (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
      {t}
    </p>
  )

  if (success) {
    return (
      <>
        <Header title={`Formulário ${area}`} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...cardStyle, textAlign: 'center', maxWidth: 420, padding: 48 }}>
            <CheckCircle2 size={56} color="var(--green)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Vacinação registrada!</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Os dados foram enviados com sucesso.</p>
            <Button onClick={() => setSuccess(false)}>Novo Registro</Button>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={`Formulário ${area}`} subtitle={`Registro de vacinação — Área ${area}`} />

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={cardStyle}>
              {sectionTitle('Identificação do Colaborador')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {errorColab && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                    Erro ao carregar colaboradores: {errorColab}
                  </div>
                )}

                {/* ─── O NOVO AUTOCOMPLETE DE NOME ─── */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <Input
                    label="Nome do Colaborador *"
                    placeholder={loadingColab ? 'Carregando lista de funcionários...' : 'Comece a digitar para buscar...'}
                    value={buscaNome}
                    autoComplete="off"
                    onChange={(e) => {
                      setBuscaNome(e.target.value)
                      setShowDropdown(true)
                      // Se o usuário apagar o nome selecionado, invalida a seleção atual
                      if (form.colaboradorId) {
                        set('colaboradorId', '')
                        set('contrato', '')
                        set('unidade', '')
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    error={errors.colaboradorId}
                    disabled={loadingColab}
                    icon={<Search size={16} />}
                  />

                  {/* CAIXA DE SUGESTÕES */}
                  <AnimatePresence>
                    {showDropdown && colaboradoresFiltrados.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: 'rgba(14,18,20,.98)', border: '1px solid var(--border-active)',
                          borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', padding: 4
                        }}
                      >
                        {colaboradoresFiltrados.slice(0, 50).map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleColabSelect(c.id, c.name)}
                            style={{
                              padding: '12px 14px', fontSize: 13, cursor: 'pointer',
                              borderRadius: 6, color: 'var(--text-primary)',
                              display: 'flex', flexDirection: 'column', gap: 2
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontWeight: 500 }}>{c.name}</span>
                            {(c.contrato || c.unidade) && (
                              <span style={{ fontSize: 10, color: 'var(--cyan)' }}>
                                {c.contrato} {c.unidade ? ` • ${c.unidade}` : ''}
                              </span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select
                    label="Contrato *"
                    placeholder="Selecione ou 'Outro'"
                    value={form.contrato}
                    onChange={(e) => set('contrato', e.target.value)}
                    error={errors.contrato}
                    options={contratoOptions}
                  />

                  {/* ─── CAMPO UNIDADE INTELIGENTE ─── */}
                  <div style={{ position: 'relative' }} ref={unidadeRef}>
                    <Input
                      label="Unidade (Localização) *"
                      placeholder="Selecione ou digite a unidade"
                      value={form.unidade}
                      autoComplete="off"
                      onChange={(e) => {
                        set('unidade', e.target.value.toUpperCase())
                        setShowUnidadeDropdown(true)
                      }}
                      onFocus={() => setShowUnidadeDropdown(true)}
                      error={errors.unidade}
                    />

                    <AnimatePresence>
                      {showUnidadeDropdown && form.unidade.trim() !== '' && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'rgba(14,18,20,.98)', border: '1px solid var(--border-active)',
                            borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: 'auto',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', padding: 4
                          }}
                        >
                          {unidadesFiltradas.length > 0 ? (
                            unidadesFiltradas.map(u => (
                              <div
                                key={u}
                                onClick={() => {
                                  set('unidade', u)
                                  setShowUnidadeDropdown(false)
                                }}
                                style={{
                                  padding: '10px 14px', fontSize: 12, cursor: 'pointer',
                                  borderRadius: 6, color: 'var(--text-primary)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                {u}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Nenhuma unidade encontrada. Aperte Tab para usar "{form.unidade}"
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence>
                  {form.contrato === '__outro__' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <Input
                        label="Contrato (digitação — CAIXA ALTA) *"
                        placeholder="EX: CONTRATO ABC 2025"
                        value={form.contratoCustom}
                        onChange={(e) => set('contratoCustom', e.target.value.toUpperCase())}
                        error={errors.contratoCustom}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input
                  label="Observação / Ressalva (Opcional)"
                  placeholder="Ex: Mudou de unidade recentemente, restrição médica..."
                  value={form.observacao}
                  onChange={(e) => set('observacao', e.target.value)}
                />
              </div>
            </div>

            <div style={cardStyle}>
              {sectionTitle('Status das Vacinas')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Select label="H1N1 *" placeholder="Status" value={form.statusH1N1} onChange={(e) => set('statusH1N1', e.target.value)} error={errors.statusH1N1} options={STATUS_OPTIONS} />
                <Select label="1ª Dose *" placeholder="Status" value={form.status1Dose} onChange={(e) => set('status1Dose', e.target.value)} error={errors.status1Dose} options={STATUS_OPTIONS} />
                <Select label="2ª Dose *" placeholder="Status" value={form.status2Dose} onChange={(e) => set('status2Dose', e.target.value)} error={errors.status2Dose} options={STATUS_OPTIONS} />
              </div>
            </div>

            <div style={cardStyle}>
              {sectionTitle('Comprovantes')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <FileDropzone label="📷 Foto do Cartão Físico *" accept="image/*" file={form.arquivoFisico} onChange={(f) => set('arquivoFisico', f)} error={errors.arquivoFisico} />
                <FileDropzone label="📄 Cartão Digital (PDF) *" accept=".pdf" file={form.arquivoDigital} onChange={(f) => set('arquivoDigital', f)} error={errors.arquivoDigital} />
              </div>
            </div>

            {submitError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--red)' }}>
                <AlertCircle size={15} />
                {submitError}
              </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 8 }}>
              <Button type="button" variant="ghost" onClick={() => { setForm(EMPTY); setBuscaNome(''); setErrors({}) }}>Limpar</Button>
              <Button type="submit" variant="primary" loading={submitting}>{submitting ? 'Enviando...' : 'Registrar Vacinação'}</Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>
            <ZeGotinha />
            <SusInstructions />
          </div>
        </div>
      </form>
    </>
  )
}
