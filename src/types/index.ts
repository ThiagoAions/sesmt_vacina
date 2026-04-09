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
  cargo: string           // NOVO
  contrato: string
  unidade: string
  area: VacinacaoArea
  statusH1N1: VacinaStatus
  status1Dose: VacinaStatus
  status2Dose: VacinaStatus
  observacao: string
  createdAt: string
  // Nota: Os status das vacinas saíram do formulário de cadastro, 
  // mas permanecem aqui para que o Dashboard continue exibindo os dados do Monday.
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface FormVacinacaoState {
  colaboradorName: string  // Agora é texto livre
  cargo: string            // NOVO
  contrato: string
  contratoCustom: string   
  unidade: string
  area: string             // 'PONTA' ou 'ADM'
  observacao: string
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