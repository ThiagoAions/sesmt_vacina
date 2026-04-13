import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, ArrowLeft, Send, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { ZeGotinha } from '@/components/forms/ZeGotinha'
import { SusInstructions } from '@/components/forms/SusInstructions'
import { useColaboradores } from '@/hooks/useColaboradores'
import { criarVacinacao, uploadFile } from '@/api/monday'
import type { FormVacinacaoState } from '@/types'

const CARGOS_SUGERIDOS = [
  'Agente de Portaria', 'Auxiliar de Serviços Gerais', 'Técnico em nível médio', 'Técnico em nível superior'
]

const EMPTY: FormVacinacaoState = {
  colaboradorName: '', dataNascimento: '', cargo: '', contrato: '', contratoCustom: '', setor: '', unidade: '', observacao: '', arquivoFisico: null, arquivoDigital: null,
}

// ─── COMPONENTES AUXILIARES ───

function FilePreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState<string | null>(null)
  
  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!file || !url) return <span style={{ color: 'var(--text-muted)' }}>—</span>

  if (file.type.startsWith('image/')) {
    return <img src={url} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }} alt="Preview" />
  }
  
  if (file.type === 'application/pdf') {
    return (
       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
         <iframe src={`${url}#toolbar=0`} style={{ width: '100%', height: 250, border: '1px solid var(--border-subtle)', borderRadius: 10, background: '#fff' }} title="PDF Preview" />
         <span style={{ fontSize: 11, color: 'var(--cyan)' }}>📄 {file.name}</span>
       </div>
    )
  }

  return <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
}

// ─── COMPONENTE PRINCIPAL ───
export function VacinacaoForm({ area }: { area: 'PONTA' | 'ADM' }) {
  const { contratos, unidades } = useColaboradores()
  const [form, setForm] = useState<FormVacinacaoState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormVacinacaoState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [showCargoDropdown, setShowCargoDropdown] = useState(false)
  const cargoRef = useRef<HTMLDivElement>(null)
  const [showUnidadeDropdown, setShowUnidadeDropdown] = useState(false)
  const unidadeRef = useRef<HTMLDivElement>(null)
  const fileRefFisico = useRef<HTMLInputElement>(null)
  const fileRefDigital = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormVacinacaoState>(k: K, v: FormVacinacaoState[K]) => setForm((p) => ({ ...p, [k]: v }))

  // ─── MÁGICA DO TEMA CLARO P/ PONTA ───
  useEffect(() => {
    if (area === 'PONTA') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
    return () => document.body.classList.remove('light-theme')
  }, [area])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cargoRef.current && !cargoRef.current.contains(e.target as Node)) setShowCargoDropdown(false)
      if (unidadeRef.current && !unidadeRef.current.contains(e.target as Node)) setShowUnidadeDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const contratoOptions = useMemo(() => [...contratos.map((c) => ({ value: c, label: c })), { value: '__outro__', label: 'Outro (digitar)' }], [contratos])

  const cargosFiltrados = useMemo(() => {
    const busca = form.cargo.toLowerCase()
    if (!busca) return CARGOS_SUGERIDOS
    return CARGOS_SUGERIDOS.filter(c => c.toLowerCase().includes(busca))
  }, [form.cargo])

  const unidadesFiltradas = useMemo(() => {
    const busca = form.unidade.trim().toLowerCase()
    if (!busca) return unidades
    const removeAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return unidades.filter(u => removeAcentos(u.toLowerCase()).includes(removeAcentos(busca)))
  }, [unidades, form.unidade])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.colaboradorName.trim()) e.colaboradorName = 'Informe seu nome completo'
    if (!form.dataNascimento) e.dataNascimento = 'Informe sua data de nascimento'
    if (!form.cargo.trim()) e.cargo = 'Informe seu cargo'
    if (area === 'PONTA') {
      if (!form.contrato) e.contrato = 'Selecione o contrato'
      if (form.contrato === '__outro__' && !form.contratoCustom.trim()) e.contratoCustom = 'Digite o contrato'
      if (!form.unidade.trim()) e.unidade = 'Informe a unidade'
    } else {
      if (!form.setor.trim()) e.setor = 'Informe seu setor'
    }
    // cartão físico é OPCIONAL — não valida
    if (!form.arquivoDigital) e.arquivoDigital = 'Anexe o comprovante digital do SUS'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowPreview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirmSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const contrato = form.contrato === '__outro__' ? form.contratoCustom.toUpperCase() : form.contrato
      const newItemId = await criarVacinacao({
        colaboradorName: form.colaboradorName.toUpperCase(),
        dataNascimento: form.dataNascimento,
        cargo: form.cargo,
        contrato,
        unidade: form.unidade,
        setor: form.setor.toUpperCase(),
        area: area,
        observacao: form.observacao,
      })
      if (newItemId) {
        await Promise.allSettled([
          form.arquivoFisico && uploadFile(newItemId, 'file_mm27rea', form.arquivoFisico),
          form.arquivoDigital && uploadFile(newItemId, 'files', form.arquivoDigital),
        ])
      }
      setSuccess(true)
      setForm(EMPTY)
      setShowPreview(false)
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Erro ao enviar.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const isPonta = area === 'PONTA'
  const accentVar = area === 'ADM' ? 'var(--purple)' : 'var(--cyan)'
  
  // ─── ESTILOS DINÂMICOS (TAMANHO DE FONTE BASEADO NA ÁREA) ───
  // No PONTA as fontes são 25-30% maiores
  const szLabel = isPonta ? 14 : 11
  const szInput = isPonta ? 16 : 13
  const szError = isPonta ? 13 : 11

  // Agora usando `var(...)` p/ que o CSS "light-theme" do body atue
  const labelStyle: React.CSSProperties = {
    fontSize: szLabel, fontWeight: 600, letterSpacing: '.8px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: 8, display: 'block',
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border-input)',
    borderRadius: 10, padding: '12px 16px', fontSize: szInput,
    color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
    outline: 'none', width: '100%',
    transition: 'border-color .2s, box-shadow .2s',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer',
    WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
    paddingRight: 36,
  }

  const cardBase: React.CSSProperties = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 16, padding: isPonta ? 24 : 32,
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)',
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border-active)'
    e.target.style.boxShadow = `0 0 0 3px rgba(0,229,255,.15)`
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, hasError?: boolean) => {
    e.target.style.borderColor = hasError ? 'var(--red)' : 'var(--border-input)'
    e.target.style.boxShadow = 'none'
  }

  // ═══════════════════════════════════════════════════
  //  TELA DE SUCESSO
  // ═══════════════════════════════════════════════════
  if (success) {
    return (
      <>
        <Header title={`Cadastro ${area}`} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, minHeight: '80vh' }}>
          <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...cardBase, textAlign: 'center', maxWidth: 460, padding: 48 }}>
            <CheckCircle2 size={56} color="var(--green)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Cadastro Realizado!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>Seus comprovantes foram enviados ao SESMT com sucesso. Obrigado!</p>
            <Button onClick={() => setSuccess(false)} style={{ fontSize: 15, padding: '12px 28px' }}>Fazer Novo Cadastro</Button>
          </motion.div>
        </div>
      </>
    )
  }

  // ═══════════════════════════════════════════════════
  //  TELA DE PRÉ-VISUALIZAÇÃO
  // ═══════════════════════════════════════════════════
  if (showPreview) {
    const lines: { label: string; value: string }[] = [
      { label: 'Nome Completo', value: form.colaboradorName.toUpperCase() },
      { label: 'Data de Nascimento', value: formatDate(form.dataNascimento) },
      { label: 'Função / Cargo', value: form.cargo },
      { label: 'Área', value: area },
    ]
    if (area === 'PONTA') {
      lines.push({ label: 'Contrato', value: form.contrato === '__outro__' ? form.contratoCustom.toUpperCase() : form.contrato })
      lines.push({ label: 'Unidade', value: form.unidade })
    } else {
      lines.push({ label: 'Setor', value: form.setor.toUpperCase() })
    }
    if (form.observacao.trim()) lines.push({ label: 'Observação', value: form.observacao })
    
    return (
      <>
        <Header title={`Cadastro de Vacinação — ${area}`} subtitle="Revise seus dados antes de confirmar o envio" />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
            
            {/* Cabeçalho Revisão */}
            <div style={{ background: `linear-gradient(135deg, rgba(0,229,255,0.05), transparent)`, borderBottom: '1px solid var(--border-subtle)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `var(--bg-input)`, border: `1px solid var(--border-subtle)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={22} color={accentVar} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Revisão de Documentos</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Leia com atenção. Você está enviando seus dados sensíveis de saúde.</p>
              </div>
            </div>

            {/* Linhas de dados (texto) */}
            <div style={{ padding: '10px 0' }}>
              {lines.map((line, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 32px',
                  borderBottom: i < lines.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-input)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{line.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{line.value}</span>
                </div>
              ))}
            </div>

            {/* Sessão de Pré-vizualização dos Arquivos */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-input)', padding: '24px 32px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 20 }}>Documentos Anexados</h3>
              <div className="grid-2" style={{ gap: 24 }}>
                <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>CÓPIA DO CARTÃO FÍSICO</p>
                  <FilePreview file={form.arquivoFisico} />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>CERTIFICADO DIGITAL (SUS)</p>
                  <FilePreview file={form.arquivoDigital} />
                </div>
              </div>
            </div>

            {/* Erro de envio */}
            {submitError && (
              <div style={{ margin: '20px 32px', padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--red)' }}>
                <AlertCircle size={18} />{submitError}
              </div>
            )}

            {/* Botões */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'var(--bg-input)' }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', border: '1.5px solid var(--border-input)',
                  borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600,
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all .2s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ArrowLeft size={18} /> Voltar 
              </button>
              <Button
                variant="primary"
                loading={submitting}
                onClick={handleConfirmSubmit}
                style={{ fontSize: 16, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {submitting ? 'Enviando...' : <><Send size={18} /> Confirmar Cadastro</>}
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  // ═══════════════════════════════════════════════════
  //  FORMULÁRIO PRINCIPAL 
  // ═══════════════════════════════════════════════════
  return (
    <>
      <Header title={`Cadastro de Vacinação — ${area}`} subtitle={`Formulário exclusivo para colaboradores da área ${area}`} />
      <form onSubmit={handleReview} noValidate>
        <div className="form-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ─── BLOCO 1: IDENTIFICAÇÃO ─── */}
            <div style={{ ...cardBase }}>
              <p style={{ ...labelStyle, color: accentVar, borderBottom: `1px solid var(--border-subtle)`, paddingBottom: 10, marginBottom: 24, fontSize: szLabel+1, letterSpacing: '1px' }}>
                Identificação Profissional
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div className="grid-2" style={{ gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{...labelStyle, color: errors.colaboradorName ? 'var(--red)' : 'var(--text-muted)'}}>Nome Completo *</label>
                    <input
                      placeholder="Ex: João da Silva"
                      value={form.colaboradorName}
                      onChange={(e) => set('colaboradorName', e.target.value)}
                      style={{ ...inputStyle, borderColor: errors.colaboradorName ? 'var(--red)' : 'var(--border-input)' }}
                      onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.colaboradorName)}
                    />
                    {errors.colaboradorName && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.colaboradorName}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{...labelStyle, color: errors.dataNascimento ? 'var(--red)' : 'var(--text-muted)'}}>Data de Nascimento *</label>
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => set('dataNascimento', e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      style={{ ...inputStyle, borderColor: errors.dataNascimento ? 'var(--red)' : 'var(--border-input)' }}
                      onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.dataNascimento)}
                    />
                    {errors.dataNascimento && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.dataNascimento}</span>}
                  </div>
                </div>

                <div style={{ position: 'relative' }} ref={cargoRef}>
                  <label style={{...labelStyle, color: errors.cargo ? 'var(--red)' : 'var(--text-muted)'}}>Função (Cargo) *</label>
                  <input
                    placeholder="Selecione ou digite seu cargo"
                    value={form.cargo} autoComplete="off"
                    onChange={(e) => { set('cargo', e.target.value); setShowCargoDropdown(true) }}
                    onFocus={(e) => { setShowCargoDropdown(true); onFocus(e) }}
                    onBlur={(e) => onBlur(e, !!errors.cargo)}
                    style={{ ...inputStyle, borderColor: errors.cargo ? 'var(--red)' : 'var(--border-input)' }}
                  />
                  {errors.cargo && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.cargo}</span>}
                  <AnimatePresence>
                    {showCargoDropdown && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 10, marginTop: 6, maxHeight: 200, overflowY: 'auto', padding: 6, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                        {cargosFiltrados.length > 0 ? cargosFiltrados.map(c => (
                          <div key={c} onClick={() => { set('cargo', c); setShowCargoDropdown(false) }} style={{ padding: '12px 14px', fontSize: szInput-1, cursor: 'pointer', borderRadius: 8, color: 'var(--text-primary)', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c}</div>
                        )) : <div style={{ padding: '12px 14px', fontSize: szInput-2, color: 'var(--text-muted)' }}>Pressione Tab para manter "{form.cargo}"</div>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {area === 'PONTA' ? (
                  <div className="grid-2" style={{ gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{...labelStyle, color: errors.contrato ? 'var(--red)' : 'var(--text-muted)'}}>Contrato *</label>
                      <select
                        value={form.contrato}
                        onChange={(e) => set('contrato', e.target.value)}
                        style={{ ...selectStyle, borderColor: errors.contrato ? 'var(--red)' : 'var(--border-input)' }}
                        onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.contrato)}
                      >
                        <option value="">Selecione...</option>
                        {contratoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {errors.contrato && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.contrato}</span>}
                    </div>
                    <div style={{ position: 'relative' }} ref={unidadeRef}>
                      <label style={{...labelStyle, color: errors.unidade ? 'var(--red)' : 'var(--text-muted)'}}>Unidade (Local de Trabalho) *</label>
                      <input
                        placeholder="Digite o local..."
                        value={form.unidade} autoComplete="off"
                        onChange={(e) => { set('unidade', e.target.value.toUpperCase()); setShowUnidadeDropdown(true) }}
                        onFocus={(e) => { setShowUnidadeDropdown(true); onFocus(e) }}
                        onBlur={(e) => onBlur(e, !!errors.unidade)}
                        style={{ ...inputStyle, borderColor: errors.unidade ? 'var(--red)' : 'var(--border-input)' }}
                      />
                      {errors.unidade && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.unidade}</span>}
                      <AnimatePresence>
                        {showUnidadeDropdown && form.unidade.trim() !== '' && (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 10, marginTop: 6, maxHeight: 200, overflowY: 'auto', padding: 6, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                            {unidadesFiltradas.length > 0 ? unidadesFiltradas.map(u => (
                              <div key={u} onClick={() => { set('unidade', u); setShowUnidadeDropdown(false) }} style={{ padding: '12px 14px', fontSize: szInput-1, cursor: 'pointer', borderRadius: 8, color: 'var(--text-primary)', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{u}</div>
                            )) : <div style={{ padding: '12px 14px', fontSize: szInput-2, color: 'var(--text-muted)' }}>Aperte Tab para manter "{form.unidade}"</div>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{...labelStyle, color: errors.setor ? 'var(--red)' : 'var(--text-muted)'}}>Setor *</label>
                    <input
                      placeholder="Digite seu setor"
                      value={form.setor}
                      onChange={(e) => set('setor', e.target.value)}
                      style={{ ...inputStyle, borderColor: errors.setor ? 'var(--red)' : 'var(--border-input)' }}
                      onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.setor)}
                    />
                    {errors.setor && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.setor}</span>}
                  </div>
                )}

                <AnimatePresence>
                  {form.contrato === '__outro__' && area === 'PONTA' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{...labelStyle, color: errors.contratoCustom ? 'var(--red)' : 'var(--text-muted)'}}>Contrato (digitação) *</label>
                        <input placeholder="EX: CONTRATO ABC 2025" value={form.contratoCustom} onChange={(e) => set('contratoCustom', e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: errors.contratoCustom ? 'var(--red)' : 'var(--border-input)' }} onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.contratoCustom)} />
                        {errors.contratoCustom && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.contratoCustom}</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Observações (Opcional)</label>
                  <input placeholder="Ex: Restrição médica..." value={form.observacao} onChange={(e) => set('observacao', e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>
            </div>

            {/* ─── BLOCO 2: ANEXOS ─── */}
            <div style={{ ...cardBase }}>
              <p style={{ ...labelStyle, color: accentVar, borderBottom: `1px solid var(--border-subtle)`, paddingBottom: 10, marginBottom: 24, fontSize: szLabel+1, letterSpacing: '1px' }}>
                Anexos Obrigatórios
              </p>
              <div className="grid-2" style={{ gap: 20 }}>
                {/* Cartão Físico — OPCIONAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{...labelStyle, color: 'var(--text-muted)'}}>
                    📷 Foto do Cartão Físico
                    <span style={{ fontSize: szLabel - 2, fontWeight: 400, letterSpacing: 0, textTransform: 'none', marginLeft: 6, opacity: 0.6 }}>(opcional)</span>
                  </label>
                  {form.arquivoFisico ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,230,118,0.07)', border: `1px solid rgba(0,230,118,0.25)`, borderRadius: 10, padding: '12px 16px' }}>
                      <CheckCircle2 size={18} color="var(--green)" />
                      <span style={{ fontSize: szInput-2, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{form.arquivoFisico.name}</span>
                      <button type="button" onClick={() => set('arquivoFisico', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>✕</button>
                    </div>
                  ) : (
                    <div onClick={() => fileRefFisico.current?.click()} style={{ border: `1.5px dashed var(--border-subtle)`, borderRadius: 12, padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all .2s', background: 'var(--bg-input)', opacity: 0.8 }}>
                      <span style={{ fontSize: 24 }}>📷</span>
                      <span style={{ fontSize: szInput-1, color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 500 }}>Clique para enviar (opcional)</span>
                      <span style={{ fontSize: szInput-3, color: 'var(--text-muted)' }}>IMAGEM · Máx. 10MB</span>
                    </div>
                  )}
                  <input ref={fileRefFisico} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) set('arquivoFisico', e.target.files[0]) }} />
                </div>

                {/* Cartão Digital — OBRIGATÓRIO — aceita imagem e PDF */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{...labelStyle, color: errors.arquivoDigital ? 'var(--red)' : 'var(--text-muted)'}}>🏥 Comprovante do SUS *</label>
                  {form.arquivoDigital ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,230,118,0.07)', border: `1px solid rgba(0,230,118,0.25)`, borderRadius: 10, padding: '12px 16px' }}>
                      <CheckCircle2 size={18} color="var(--green)" />
                      <span style={{ fontSize: szInput-2, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{form.arquivoDigital.name}</span>
                      <button type="button" onClick={() => set('arquivoDigital', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>✕</button>
                    </div>
                  ) : (
                    <div onClick={() => fileRefDigital.current?.click()} style={{ border: `1.5px dashed ${errors.arquivoDigital ? 'var(--red)' : 'var(--border-subtle)'}`, borderRadius: 12, padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all .2s', background: 'var(--bg-input)' }}>
                      <span style={{ fontSize: 24 }}>📤</span>
                      <span style={{ fontSize: szInput-1, color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 500 }}>Clique para enviar o comprovante</span>
                      <span style={{ fontSize: szInput-3, color: 'var(--text-muted)' }}>PDF ou IMAGEM · Máx. 10MB</span>
                    </div>
                  )}
                  <input ref={fileRefDigital} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) set('arquivoDigital', e.target.files[0]) }} />
                  {errors.arquivoDigital && <span style={{ fontSize: szError, color: 'var(--red)' }}>{errors.arquivoDigital}</span>}
                </div>
              </div>
            </div>

            {submitError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: szInput-2, color: 'var(--red)' }}><AlertCircle size={16} />{submitError}</motion.div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" style={{ fontSize: isPonta ? 16 : 14, padding: isPonta ? '14px 32px' : '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} /> Revisar Dados
              </Button>
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
