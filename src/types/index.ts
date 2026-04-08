// ─── Monday.com Raw Types ────────────────────────────────────────────────────

export interface MondayColumnValue {
  id: string
  text: string
  value: string
  column?: { title: string }
}

export interface MondayItem {
  id: string
  name: string
  column_values: MondayColumnValue[]
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Colaborador {
  id: string         // Monday item ID — used for Connect Boards link
  name: string
  contrato: string
  unidade: string
}

export type VacinacaoArea = 'PONTA' | 'ADM'

export type VacinaStatus = 'Em dia' | 'Atrasada' | 'Não tomou'

export interface VacinacaoItem {
  id: string
  colaboradorName: string
  colaboradorId: string   // linked board item id (Board 1)
  contrato: string
  unidade: string
  area: VacinacaoArea
  statusH1N1: VacinaStatus
  status1Dose: VacinaStatus
  status2Dose: VacinaStatus
  observacao: string
  createdAt: string
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface FormVacinacaoState {
  colaboradorId: string
  colaboradorName: string
  contrato: string
  contratoCustom: string   // when "Outro" is selected
  unidade: string
  observacao: string
  statusH1N1: string
  status1Dose: string
  status2Dose: string
  arquivoFisico: File | null
  arquivoDigital: File | null
}

// ─── Dashboard Stats (computed from Board 2) ─────────────────────────────────

export interface DashboardStats {
  total: number
  semH1N1: number
  atrasados1Dose: number
  atrasados2Dose: number
  admTotal: number
  admRegulares: number
  pontaTotal: number
  pontaRegulares: number
}