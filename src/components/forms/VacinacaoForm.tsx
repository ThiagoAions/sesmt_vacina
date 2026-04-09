import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
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

const CARGOS_SUGERIDOS = [
  'Agente de Portaria',
  'Auxiliar de Serviços Gerais',
  'Técnico em nível médio',
  'Técnico em nível superior'
]

const EMPTY: FormVacinacaoState = {
  colaboradorName: '',
  cargo: '',
  contrato: '',
  contratoCustom: '',
  unidade: '',
  area: '',
  observacao: '',
  arquivoFisico: null,
  arquivoDigital: null,
}

export function VacinacaoForm({ initialArea }: { initialArea?: string }) {
  // Ainda usamos os contratos e unidades puxados do Monday para as caixas de seleção
  const { contratos, unidades } = useColaboradores()
  const [form, setForm] = useState<FormVacinacaoState>({
    ...EMPTY,
    area: initialArea || '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormVacinacaoState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Autocompletes
  const [showCargoDropdown, setShowCargoDropdown] = useState(false)
  const cargoRef = useRef<HTMLDivElement>(null)
  
  const [showUnidadeDropdown, setShowUnidadeDropdown] = useState(false)
  const unidadeRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof FormVacinacaoState>(k: K, v: FormVacinacaoState[K]) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cargoRef.current && !cargoRef.current.contains(e.target as Node)) setShowCargoDropdown(false)
      if (unidadeRef.current && !unidadeRef.current.contains(e.target as Node)) setShowUnidadeDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const contratoOptions = useMemo(() => [...contratos.map((c) => ({ value: c, label: c })), { value: '__outro__', label: 'Outro (digitar)' }], [contratos])

  // Filtro Inteligente de Cargo
  const cargosFiltrados = useMemo(() => {
    const busca = form.cargo.toLowerCase()
    if (!busca) return CARGOS_SUGERIDOS
    return CARGOS_SUGERIDOS.filter(c => c.toLowerCase().includes(busca))
  }, [form.cargo])

  // Filtro Inteligente de Unidade
  const unidadesFiltradas = useMemo(() => {
    const busca = form.unidade.trim().toLowerCase()
    if (!busca) return unidades
    const removeAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const buscaLimpa = removeAcentos(busca)
    return unidades.filter(u => removeAcentos(u.toLowerCase()).includes(buscaLimpa))
  }, [unidades, form.unidade])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.colaboradorName.trim()) e.colaboradorName = 'Informe seu nome completo'
    if (!form.area) e.area = 'Selecione a área'
    if (!form.cargo.trim()) e.cargo = 'Informe seu cargo'
    if (!form.contrato) e.contrato = 'Selecione o contrato'
    if (form.contrato === '__outro__' && !form.contratoCustom.trim()) e.contratoCustom = 'Digite o contrato'
    if (!form.unidade.trim()) e.unidade = 'Informe a unidade'
    if (!form.arquivoFisico) e.arquivoFisico = 'Anexe a foto do cartão físico'
    if (!form.arquivoDigital) e.arquivoDigital = 'Anexe o PDF do SUS'
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
        colaboradorName: form.colaboradorName.toUpperCase(),
        cargo: form.cargo,
        contrato,
        unidade: form.unidade,
        area: form.area,
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
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Erro ao enviar.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 28 }

  if (success) {
    return (
      <>
        <Header title="Envio de Comprovante" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...cardStyle, textAlign: 'center', maxWidth: 420, padding: 48 }}>
            <CheckCircle2 size={56} color="var(--green)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Cadastro Realizado!</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Seus comprovantes foram enviados ao SESMT com sucesso.</p>
            <Button onClick={() => setSuccess(false)}>Fazer Novo Cadastro</Button>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Cadastro de Vacinação" subtitle="Envie seu cartão de vacina atualizado para o SESMT" />
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* DADOS DO COLABORADOR */}
            <div style={cardStyle}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>Identificação Profissional</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                {/* NOME LIVRE */}
                <Input label="Nome Completo *" placeholder="Digite seu nome completo" value={form.colaboradorName} onChange={(e) => set('colaboradorName', e.target.value)} error={errors.colaboradorName} />

                <div className="grid-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Select label="Área de Atuação *" value={form.area} onChange={(e) => set('area', e.target.value)} error={errors.area} options={[{ value: 'PONTA', label: 'PONTA (Trabalha fora da Sede)' }, { value: 'ADM', label: 'ADM (Trabalha na Sede)' }]} placeholder="Selecione..." />
                  </div>

                  {/* CARGO INTELIGENTE */}
                  <div style={{ position: 'relative' }} ref={cargoRef}>
                    <Input label="Função (Cargo) *" placeholder="Selecione ou digite seu cargo" value={form.cargo} autoComplete="off" onChange={(e) => { set('cargo', e.target.value); setShowCargoDropdown(true) }} onFocus={() => setShowCargoDropdown(true)} error={errors.cargo} />
                    <AnimatePresence>
                      {showCargoDropdown && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'rgba(14,18,20,.98)', border: '1px solid var(--border-active)', borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {cargosFiltrados.length > 0 ? cargosFiltrados.map(c => (
                            <div key={c} onClick={() => { set('cargo', c); setShowCargoDropdown(false) }} style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 6, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c}</div>
                          )) : <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>Pressione Tab para usar o cargo digitado</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid-2">
                  <Select label="Modalidade de Contrato *" placeholder="Selecione ou 'Outro'" value={form.contrato} onChange={(e) => set('contrato', e.target.value)} error={errors.contrato} options={contratoOptions} />
                  
                  {/* UNIDADE INTELIGENTE */}
                  <div style={{ position: 'relative' }} ref={unidadeRef}>
                    <Input label="Unidade (Local de Trabalho) *" placeholder="Selecione ou digite a unidade" value={form.unidade} autoComplete="off" onChange={(e) => { set('unidade', e.target.value.toUpperCase()); setShowUnidadeDropdown(true) }} onFocus={() => setShowUnidadeDropdown(true)} error={errors.unidade} />
                    <AnimatePresence>
                      {showUnidadeDropdown && form.unidade.trim() !== '' && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'rgba(14,18,20,.98)', border: '1px solid var(--border-active)', borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {unidadesFiltradas.length > 0 ? unidadesFiltradas.map(u => (
                            <div key={u} onClick={() => { set('unidade', u); setShowUnidadeDropdown(false) }} style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 6, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{u}</div>
                          )) : <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>Aperte Tab para usar "{form.unidade}"</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence>
                  {form.contrato === '__outro__' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <Input label="Contrato (digitação — CAIXA ALTA) *" placeholder="EX: CONTRATO ABC 2025" value={form.contratoCustom} onChange={(e) => set('contratoCustom', e.target.value.toUpperCase())} error={errors.contratoCustom} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input label="Observações (Opcional)" placeholder="Ex: Restrição médica..." value={form.observacao} onChange={(e) => set('observacao', e.target.value)} />
              </div>
            </div>

            {/* COMPROVANTES */}
            <div style={cardStyle}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>Anexos Obrigatórios</p>
              <div className="grid-2">
                <FileDropzone label="📷 Foto do Cartão Físico *" accept="image/*" file={form.arquivoFisico} onChange={(f) => set('arquivoFisico', f)} error={errors.arquivoFisico} />
                <FileDropzone label="📄 Cartão Digital (PDF) *" accept=".pdf" file={form.arquivoDigital} onChange={(f) => set('arquivoDigital', f)} error={errors.arquivoDigital} />
              </div>
            </div>

            {submitError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--red)' }}><AlertCircle size={15} />{submitError}</motion.div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="submit" variant="primary" loading={submitting}>{submitting ? 'Enviando...' : 'Enviar Cadastro'}</Button>
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
