import { useState, useMemo } from 'react'
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

const STATUS_OPTIONS = [
  { value: 'Vacinado', label: 'Vacinado ✅' },
  { value: 'Pendente', label: 'Pendente ⏳' },
  { value: 'Atrasado', label: 'Atrasado ⚠️' },
  { value: 'Recusado', label: 'Recusado ❌' },
]

const EMPTY: FormVacinacaoState = {
  colaboradorId: '',
  colaboradorName: '',
  contrato: '',
  contratoCustom: '',
  unidade: '',
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

  const set = <K extends keyof FormVacinacaoState>(k: K, v: FormVacinacaoState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  // When a colaborador is selected, auto-fill contrato & unidade if available
  const handleColabSelect = (id: string) => {
    const c = colaboradores.find((x) => x.id === id)
    if (!c) return
    set('colaboradorId', id)
    set('colaboradorName', c.name)
    if (c.contrato) set('contrato', c.contrato)
    if (c.unidade) set('unidade', c.unidade)
  }

  // Contratos: API list + "Outro"
  const contratoOptions = useMemo(() => [
    ...contratos.map((c) => ({ value: c, label: c })),
    { value: '__outro__', label: 'Outro (digitar)' },
  ], [contratos])

  const unidadeOptions = useMemo(() =>
    unidades.map((u) => ({ value: u, label: u })),
  [unidades])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.colaboradorId) e.colaboradorId = 'Selecione o colaborador'
    if (!form.contrato) e.contrato = 'Selecione o contrato'
    if (form.contrato === '__outro__' && !form.contratoCustom.trim())
      e.contratoCustom = 'Digite o contrato'
    if (!form.unidade) e.unidade = 'Selecione a unidade'
    if (!form.statusH1N1) e.statusH1N1 = 'Selecione o status'
    if (!form.status1Dose) e.status1Dose = 'Selecione o status'
    if (!form.status2Dose) e.status2Dose = 'Selecione o status'
    if (!form.arquivoFisico) e.arquivoFisico = 'Foto do cartão físico obrigatória'
    if (!form.arquivoDigital) e.arquivoDigital = 'PDF do cartão digital obrigatório'
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

      // 1. Create item on Board 2
      const newItemId = await criarVacinacao({
        colaboradorName: form.colaboradorName,
        colaboradorId: form.colaboradorId,
        contrato,
        unidade: form.unidade,
        area,
        statusH1N1: form.statusH1N1,
        status1Dose: form.status1Dose,
        status2Dose: form.status2Dose,
      })

      // 2. Upload files (non-blocking — best-effort)
      if (newItemId) {
        await Promise.allSettled([
          form.arquivoFisico  && uploadFile(newItemId, 'files',  form.arquivoFisico),
          form.arquivoDigital && uploadFile(newItemId, 'files0', form.arquivoDigital),
        ])
      }

      setSuccess(true)
      setForm(EMPTY)
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
          <motion.div
            initial={{ scale: .8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ ...cardStyle, textAlign: 'center', maxWidth: 420, padding: 48 }}
          >
            <CheckCircle2 size={56} color="var(--green)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Vacinação registrada!
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
              Os dados foram enviados com sucesso ao board do Monday.com.
            </p>
            <Button onClick={() => setSuccess(false)}>Novo Registro</Button>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title={`Formulário ${area}`}
        subtitle={`Registro de vacinação — Área ${area}`}
      />

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ─── Left Column: Main Form ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Colaborador */}
            <div style={cardStyle}>
              {sectionTitle('Identificação do Colaborador')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {errorColab && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                    Erro ao carregar colaboradores: {errorColab}
                  </div>
                )}

                <Select
                  label="Nome do Colaborador *"
                  placeholder={loadingColab ? 'Carregando...' : 'Selecione o colaborador'}
                  value={form.colaboradorId}
                  onChange={(e) => handleColabSelect(e.target.value)}
                  error={errors.colaboradorId}
                  options={colaboradores.map((c) => ({ value: c.id, label: c.name }))}
                  disabled={loadingColab}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select
                    label="Contrato *"
                    placeholder="Selecione ou 'Outro'"
                    value={form.contrato}
                    onChange={(e) => set('contrato', e.target.value)}
                    error={errors.contrato}
                    options={contratoOptions}
                  />

                  <Select
                    label="Unidade *"
                    placeholder="Selecione a unidade"
                    value={form.unidade}
                    onChange={(e) => set('unidade', e.target.value)}
                    error={errors.unidade}
                    options={unidadeOptions}
                  />
                </div>

                {/* Custom contrato input (shows when "Outro" is selected) */}
                <AnimatePresence>
                  {form.contrato === '__outro__' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Input
                        label="Contrato (digitação — CAIXA ALTA) *"
                        placeholder="EX: CONTRATO ABC 2025"
                        value={form.contratoCustom}
                        onChange={(e) => set('contratoCustom', e.target.value.toUpperCase())}
                        error={errors.contratoCustom}
                        hint="Digite em caixa alta. Será salvo exatamente como digitado."
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status das Doses */}
            <div style={cardStyle}>
              {sectionTitle('Status das Vacinas')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Select
                  label="H1N1 *"
                  placeholder="Status"
                  value={form.statusH1N1}
                  onChange={(e) => set('statusH1N1', e.target.value)}
                  error={errors.statusH1N1}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="1ª Dose *"
                  placeholder="Status"
                  value={form.status1Dose}
                  onChange={(e) => set('status1Dose', e.target.value)}
                  error={errors.status1Dose}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="2ª Dose *"
                  placeholder="Status"
                  value={form.status2Dose}
                  onChange={(e) => set('status2Dose', e.target.value)}
                  error={errors.status2Dose}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Uploads */}
            <div style={cardStyle}>
              {sectionTitle('Comprovantes')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <FileDropzone
                  label="📷 Foto do Cartão Físico *"
                  accept="image/*"
                  file={form.arquivoFisico}
                  onChange={(f) => set('arquivoFisico', f)}
                  error={errors.arquivoFisico}
                />
                <FileDropzone
                  label="📄 Cartão Digital (PDF) *"
                  accept=".pdf"
                  file={form.arquivoDigital}
                  onChange={(f) => set('arquivoDigital', f)}
                  error={errors.arquivoDigital}
                />
              </div>
            </div>

            {/* Submit area */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '12px 16px', background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.25)', borderRadius: 10,
                  display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--red)',
                }}
              >
                <AlertCircle size={15} />
                {submitError}
              </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 8 }}>
              <Button type="button" variant="ghost" onClick={() => { setForm(EMPTY); setErrors({}) }}>
                Limpar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? 'Enviando...' : 'Registrar Vacinação'}
              </Button>
            </div>
          </div>

          {/* ─── Right Column: Sidebar helpers ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>
            <ZeGotinha />
            <SusInstructions />
          </div>
        </div>
      </form>
    </>
  )
}
