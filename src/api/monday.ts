import type { Colaborador, VacinacaoItem, VacinaStatus, MondayItem, DashboardStats } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = '/monday-api/v2'
const TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzNDI0NzA0MSwiYWFpIjoxMSwidWlkIjoxMDA5ODMxNjIsImlhZCI6IjIwMjYtMDMtMTdUMTU6NTE6MjcuMDAwWiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjEyNjg1MDA2LCJyZ24iOiJ1c2UxIn0.DF_TG5r-L5NLJfGTrpILjjtsLEUy_aJABsly0eEPXV0'

/**
 * Board 1 — "Controle de atestados - Ponta" [READ ONLY]
 * Used to list colaboradores, their contracts and units.
 */
const BOARD_FONTE = '18298015951'

/**
 * Board 2 — "Gestão de Vacinação SESMT" [WRITE]
 * Target for all form submissions.
 */
const BOARD_DESTINO = '18407626532'

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function mondayGQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Monday HTTP ${res.status}: ${res.statusText}`)
  }

  const json = await res.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? 'Monday API error')
  }

  return json.data as T
}

// ─── Board 1: Fetch Colaboradores (O Alimentador) ─────────────────────────────────────────────

export async function fetchColaboradores(): Promise<Colaborador[]> {
  const query = `
    query GetColaboradores($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              column {
                title
              }
            }
          }
        }
      }
    }
  `

  const data = await mondayGQL<{ boards: [{ items_page: { items: MondayItem[] } }] }>(
    query,
    { boardId: BOARD_FONTE },
  )

  const items = data?.boards?.[0]?.items_page?.items ?? []

  return items
    .filter((i) => i.name.trim() !== '')
    .map((item) => {
      // Função inteligente: Busca pelo ID exato ou pelo título da coluna
      const get = (idsExatos: string[], titulos: string[]) => {
        for (const cv of item.column_values) {
          if (
            idsExatos.includes(cv.id) || 
            (cv.column?.title && titulos.some(t => cv.column!.title.toLowerCase().includes(t.toLowerCase())))
          ) {
            if (cv.text) return cv.text
          }
        }
        return ''
      }

      return {
        id: item.id,
        name: item.name,
        // Usa o ID 'department' do quadro antigo
        contrato: get(['department'], ['contrato', 'tipo de contrato']),
        // Usa o ID 'dropdown_mkztj8wp' (CETAM) e continua varrendo as outras unidades (SEMSA, SEDUC, etc.)
        unidade: get(['dropdown_mkztj8wp'], ['cetam', 'semsa', 'escola', 'interior', 'detran', 'coorde', 'unidade não listada', 'un. n', 'unidade']),
      }
    })
}

// ─── Board 2: Fetch Vacinações (for Dashboard) ────────────────────────────────

export async function fetchVacinacoes(): Promise<VacinacaoItem[]> {
  const query = `
    query GetVacinacoes($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 500) {
          items {
            id
            name
            created_at
            column_values { id text }
          }
        }
      }
    }
  `

  // Função auxiliar para buscar e mapear um quadro específico
  const fetchBoard = async (boardId: string, isADM: boolean): Promise<VacinacaoItem[]> => {
    const data = await mondayGQL<any>(query, { boardId })
    const items = data?.boards?.[0]?.items_page?.items ?? []

    return items.map((item: any) => {
      const get = (ids: string[]) => {
        for (const id of ids) {
          const cv = item.column_values.find((c: any) => c.id === id || c.id.includes(id))
          if (cv?.text) return cv.text
        }
        return ''
      }

      return {
        id: item.id,
        boardId: boardId, // Guarda a origem!
        colaboradorName: item.name,
        dataNascimento: isADM ? get(['date_mm29vgra']) : get(['date_mm298tyx']),
        idade: calcularIdade(isADM ? get(['date_mm29vgra']) : get(['date_mm298tyx'])),
        // Em Ponta o cargo é color_mm28bfj4, em ADM é text_mm29scra
        cargo: get(['color_mm28bfj4', 'text_mm29scra']),
        // No ADM pega do Setor (text_mm29c7sc), na Ponta pega do Contrato (text_mm278rts)
        contrato: isADM ? get(['text_mm29c7sc']) : get(['text_mm278rts']),
        unidade: get(['text_mm27t2ky']),
        area: isADM ? 'ADM' : 'PONTA',
        observacao: get(['text_mm275362']),
        createdAt: item.created_at ?? '',
        statusH1N1: (get(['color_mm29hmf8']) || 'Em Análise') as VacinaStatus,
        statusHerpesZoster: (get(['color_mm29tzqy']) || 'Em Análise') as VacinaStatus,
        statusPneumococica: (get(['color_mm28nke8']) || 'Em Análise') as VacinaStatus,
        statusInfluenza: (get(['color_mm28cy7n']) || 'Em Análise') as VacinaStatus,
        statusFebreAmarela: (get(['color_mm28crnh']) || 'Em Análise') as VacinaStatus,
        statusTripliceViral: (get(['color_mm28mr83']) || 'Em Análise') as VacinaStatus,
        statusDuplaAdulta: (get(['color_mm287sya']) || 'Em Análise') as VacinaStatus,
        statusHepatiteB: (get(['color_mm28vybv']) || 'Em Análise') as VacinaStatus,
      }
    })
  }

  // Faz as duas requisições em paralelo para ser super rápido!
  const [ponta, adm] = await Promise.all([
    fetchBoard('18407626532', false), // ID da PONTA
    fetchBoard('18408098438', true)   // ID do ADM
  ])

  // Junta as duas listas e ordena pela data de criação
  return [...ponta, ...adm].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ─── Board 2: Compute Stats ──────────────────────────────────────────────────

export function computeStats(items: VacinacaoItem[]): DashboardStats {
  const stats: DashboardStats = {
    total: items.length,
    admTotal: 0, admRegulares: 0, pontaTotal: 0, pontaRegulares: 0,
    atrasoH1N1: 0, atrasoHerpesZoster: 0, atrasoPneumococica: 0, atrasoInfluenza: 0,
    atrasoFebreAmarela: 0, atrasoTripliceViral: 0, atrasoDuplaAdulta: 0, atrasoHepatiteB: 0
  }

  for (const v of items) {
    if (v.statusH1N1 !== 'Em dia') stats.atrasoH1N1++
    if (v.statusHerpesZoster !== 'Em dia') stats.atrasoHerpesZoster++
    if (v.statusPneumococica !== 'Em dia') stats.atrasoPneumococica++
    if (v.statusInfluenza !== 'Em dia') stats.atrasoInfluenza++
    if (v.statusFebreAmarela !== 'Em dia') stats.atrasoFebreAmarela++
    if (v.statusTripliceViral !== 'Em dia') stats.atrasoTripliceViral++
    if (v.statusDuplaAdulta !== 'Em dia') stats.atrasoDuplaAdulta++
    if (v.statusHepatiteB !== 'Em dia') stats.atrasoHepatiteB++

    const regular = 
      v.statusH1N1 === 'Em dia' && v.statusHerpesZoster === 'Em dia' && 
      v.statusPneumococica === 'Em dia' && v.statusInfluenza === 'Em dia' && 
      v.statusFebreAmarela === 'Em dia' && v.statusTripliceViral === 'Em dia' && 
      v.statusDuplaAdulta === 'Em dia' && v.statusHepatiteB === 'Em dia'

    if (v.area === 'ADM') {
      stats.admTotal++
      if (regular) stats.admRegulares++
    } else {
      stats.pontaTotal++
      if (regular) stats.pontaRegulares++
    }
  }

  return stats
}

// ─── Board 2: Create Vacinação Item (Auto-Cadastro) ──────────────────────────

// Função auxiliar para calcular idade
export function calcularIdade(dataNasc: string): number {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

interface CreateItemPayload {
  colaboradorName: string
  dataNascimento: string
  cargo: string
  contrato: string
  unidade: string
  setor: string
  area: 'PONTA' | 'ADM'
  observacao: string
}

export async function criarVacinacao(payload: CreateItemPayload): Promise<string> {
  const isADM = payload.area === 'ADM'
  
  // 🎯 Roteamento Mágico: Escolhe o quadro com base na Área
  const boardId = isADM ? '18408098438' : '18407626532'

  // 🧠 LÓGICA DE AUTOMAÇÃO (ADULTO SAUDÁVEL)
  const idade = calcularIdade(payload.dataNascimento)
  const isAdulto = idade >= 18 && idade < 60
  
  // Por padrão, todas as vacinas nascem como "Não tomou" para o SESMT avaliar
  let statusPneumo = 'Não tomou'
  let statusZoster = 'Não tomou'
  let statusTriplice = 'Não tomou'

  // SE FOR ADULTO (< 60 anos)
  if (isAdulto) {
    statusPneumo = 'Não se aplica'
    statusZoster = 'Não se aplica'
  }
  
  // SE FOR IDOSO (60+ anos)
  if (!isAdulto) {
      statusTriplice = 'Não se aplica' 
  }

  const columnValues: Record<string, unknown> = {
    "color_mm27z9q9": { label: payload.area },  // Área
  }
  
  // Status preenchidos automaticamente conforme Idade
  columnValues["color_mm28nke8"] = { label: statusPneumo !== 'Não tomou' ? statusPneumo : 'Em Análise' };
  columnValues["color_mm29tzqy"] = { label: statusZoster !== 'Não tomou' ? statusZoster : 'Em Análise' };
  columnValues["color_mm28mr83"] = { label: statusTriplice !== 'Não tomou' ? statusTriplice : 'Em Análise' };

  // O resto nasce obrigatoriamente como "Em Análise" (que é a nova string adicionada no Monday pelo usuário)
  columnValues["color_mm28vybv"] = { label: "Em Análise" };
  columnValues["color_mm287sya"] = { label: "Em Análise" };
  columnValues["color_mm28crnh"] = { label: "Em Análise" };
  columnValues["color_mm28cy7n"] = { label: "Em Análise" };
  columnValues["color_mm29hmf8"] = { label: "Em Análise" };

  // Mapeamento condicional de colunas (ADM vs Ponta)
  if (isADM) {
    columnValues["date_mm29vgra"] = { date: payload.dataNascimento } // Data Nascimento ADM
    columnValues["text_mm29scra"] = payload.cargo // Cargo no ADM (Texto)
    columnValues["text_mm29c7sc"] = payload.setor // Coluna SETOR no quadro ADM
  } else {
    columnValues["date_mm298tyx"] = { date: payload.dataNascimento } // Data Nascimento Ponta
    columnValues["color_mm28bfj4"] = { label: payload.cargo } // Cargo em Ponta (Color)
    columnValues["text_mm278rts"] = payload.contrato // Coluna Contrato (Ponta)
    columnValues["text_mm27t2ky"] = payload.unidade  // Coluna Unidade (Ponta)
  }

  // Não enviamos o group_id. Assim o Monday coloca automaticamente no grupo padrão do topo!
  const mutation = `
    mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  const data = await mondayGQL<{ create_item: { id: string } }>(mutation, {
    boardId: boardId,
    itemName: payload.colaboradorName,
    columnValues: JSON.stringify(columnValues),
  })

  return data?.create_item?.id ?? ''
}

// ─── Board 2: Atualizar Vacinação Existente (Edição Rápida) ────────────────────

export async function atualizarVacinacao(
  boardId: string, 
  itemId: string, 
  isADM: boolean,
  dados: any
): Promise<void> {
  const columnValues: Record<string, unknown> = {
    // Vacinas (IDs Reais mantidos para não quebrar a integração)
    'color_mm29hmf8': { label: dados.statusH1N1 },
    'color_mm29tzqy': { label: dados.statusHerpesZoster },
    'color_mm28nke8': { label: dados.statusPneumococica },
    'color_mm28cy7n': { label: dados.statusInfluenza },
    'color_mm28crnh': { label: dados.statusFebreAmarela },
    'color_mm28mr83': { label: dados.statusTripliceViral },
    'color_mm287sya': { label: dados.statusDuplaAdulta },
    'color_mm28vybv': { label: dados.statusHepatiteB },
    
    // Área
    'color_mm27z9q9': { label: dados.area },
  }

  // Diferenciação de colunas entre ADM e PONTA (Cargo/Setor/Unidade)
  if (isADM) {
    columnValues['text_mm29scra'] = dados.cargo // No ADM, cargo é texto
    columnValues['text_mm29c7sc'] = dados.contrato // No ADM, 'contrato' é o Setor
  } else {
    columnValues['color_mm28bfj4'] = { label: dados.cargo } // Na Ponta, cargo é status/color
    columnValues['text_mm278rts'] = dados.contrato // Na Ponta, é Contrato
    columnValues['text_mm27t2ky'] = dados.unidade  // Na Ponta, atualiza a Unidade
  }

  // Mutação combinada: Atualiza colunas e o Nome do item
  const mutation = `
    mutation UpdateItem($boardId: ID!, $itemId: ID!, $itemName: JSON!, $columnValues: JSON!) {
      change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues, create_labels_if_missing: true) { id }
      n: change_column_value(board_id: $boardId, item_id: $itemId, column_id: "name", value: $itemName) { id }
    }
  `

  await mondayGQL(mutation, {
    boardId: boardId,
    itemId: itemId,
    itemName: JSON.stringify(dados.colaboradorName),
    columnValues: JSON.stringify(columnValues),
  })
}

// ─── Board 2: Upload File to an Item Column ───────────────────────────────────

export async function uploadFile(
  itemId: string,
  columnId: string,
  file: File,
): Promise<void> {
  const formData = new FormData()

  // 1. Query compacta
  formData.append('query', `mutation ($file: File!) { add_file_to_column(item_id: ${itemId}, column_id: "${columnId}", file: $file) { id } }`)

  // 2. Variáveis vazias
  formData.append('variables', JSON.stringify({ file: null }))

  // 3. Mapa numérico (Padrão Apollo mais robusto)
  formData.append('map', JSON.stringify({ '0': ['variables.file'] }))

  // 4. O arquivo entra com a chave '0' para bater com o mapa
  formData.append('0', file, file.name)

  try {
    const res = await fetch(`${API_URL}/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      body: formData,
    })

    const data = await res.json()

    if (data.errors && data.errors.length > 0) {
      alert(`O Monday recusou o arquivo na coluna ${columnId}: ${data.errors[0].message}`)
    }

  } catch (err) {
    console.error('Erro detalhado:', err)
    alert(`Bloqueio de rede na coluna ${columnId}. \n\n⚠️ DICA: Tente desativar extensões de bloqueio de anúncio (AdBlock) ou tente em uma aba anônima.`)
  }
}