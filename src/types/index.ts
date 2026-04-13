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

export type VacinaStatus = 'Em dia' | 'Atrasada' | 'Não tomou' | '1ª dose (Aguard. 2ª)' | '2ª Dose (Aguard. 3ª)' | '2ª Dose' | 'Aguard. Reforço (10 anos)' | 'Não se aplica' | 'Em Análise'

export interface VacinacaoItem {
  id: string
  boardId: string         // 🌟 NOVO: Guarda o ID do quadro (Ponta ou ADM)
  colaboradorName: string
  dataNascimento: string  // NOVO
  idade: number           // NOVO (Calculado no frontend)
  cargo: string
  contrato: string        // Guarda o Contrato (Ponta) ou o Setor (ADM)
  unidade: string
  area: VacinacaoArea
  observacao: string
  createdAt: string
  statusH1N1: VacinaStatus
  statusHerpesZoster: VacinaStatus
  statusPneumococica: VacinaStatus
  statusInfluenza: VacinaStatus
  statusFebreAmarela: VacinaStatus
  statusTripliceViral: VacinaStatus
  statusDuplaAdulta: VacinaStatus
  statusHepatiteB: VacinaStatus
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface FormVacinacaoState {
  colaboradorName: string
  dataNascimento: string
  cargo: string
  contrato: string
  contratoCustom: string
  setor: string          // NOVO PARA O ADM
  unidade: string
  observacao: string
  arquivoFisico: File | null
  arquivoDigital: File | null
}

// ─── Dashboard Stats (computed from Board 2) ─────────────────────────────────

export interface DashboardStats {
  total: number
  admTotal: number
  admRegulares: number
  pontaTotal: number
  pontaRegulares: number
  // Contadores de Atraso por Vacina:
  atrasoH1N1: number
  atrasoHerpesZoster: number
  atrasoPneumococica: number
  atrasoInfluenza: number
  atrasoFebreAmarela: number
  atrasoTripliceViral: number
  atrasoDuplaAdulta: number
  atrasoHepatiteB: number
}