import type { Colaborador, VacinacaoItem, MondayItem, DashboardStats } from '@/types'

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
            column_values {
              id
              text
            }
          }
        }
      }
    }
  `

  const data = await mondayGQL<{
    boards: [{ items_page: { items: Array<MondayItem & { created_at: string }> } }]
  }>(query, { boardId: BOARD_DESTINO }) // Uses BOARD_DESTINO constant

  const items = data?.boards?.[0]?.items_page?.items ?? []

  return items.map((item) => {
    const get = (ids: string[]) => {
      for (const id of ids) {
        const cv = item.column_values.find((c) => c.id === id || c.id.includes(id))
        if (cv?.text) return cv.text
      }
      return ''
    }

    return {
      id: item.id,
      colaboradorName: item.name,
      colaboradorId: '',
      // Colocamos os IDs novos na lista de busca:
      contrato: get(['text_mm278rts', 'text', 'contrato']),
      unidade: get(['text_mm27t2ky', 'text0', 'unidade']),
      area: (get(['color_mm27z9q9', 'text1', 'area']).toUpperCase() as 'PONTA' | 'ADM') || 'PONTA',
      statusH1N1: (get(['color_mm27vwvb', 'status', 'h1n1']) || 'Não tomou') as VacinacaoItem['statusH1N1'],
      status1Dose: (get(['color_mm275ygv', 'status4', '1dose', 'dose1']) || 'Não tomou') as VacinacaoItem['status1Dose'],
      status2Dose: (get(['color_mm27ya8f', 'status5', '2dose', 'dose2']) || 'Não tomou') as VacinacaoItem['status2Dose'],
      observacao: get(['text2', 'obs']),
      createdAt: item.created_at ?? '',
    }
  })
}

// ─── Board 2: Compute Stats (no extra call, reuses vacinacoes) ────────────────

export function computeStats(items: VacinacaoItem[]): DashboardStats {
  let semH1N1 = 0
  let atrasados1Dose = 0
  let atrasados2Dose = 0
  let admTotal = 0
  let admRegulares = 0
  let pontaTotal = 0
  let pontaRegulares = 0

  for (const v of items) {
    if (v.statusH1N1 !== 'Em dia') semH1N1++
    if (v.status1Dose === 'Atrasada') atrasados1Dose++
    if (v.status2Dose === 'Atrasada') atrasados2Dose++

    const regular =
      v.statusH1N1 === 'Em dia' &&
      v.status1Dose === 'Em dia' &&
      v.status2Dose === 'Em dia'

    if (v.area === 'ADM') {
      admTotal++
      if (regular) admRegulares++
    } else {
      pontaTotal++
      if (regular) pontaRegulares++
    }
  }

  return {
    total: items.length,
    semH1N1,
    atrasados1Dose,
    atrasados2Dose,
    admTotal,
    admRegulares,
    pontaTotal,
    pontaRegulares,
  }
}

// ─── Board 2: Create Vacinação Item (Mutation) ────────────────────────────────

interface CreateItemPayload {
  colaboradorName: string
  colaboradorId: string   // ID da pessoa no Board 1 (Atestados)
  contrato: string
  unidade: string
  area: string
  statusH1N1: string
  status1Dose: string
  status2Dose: string
  observacao: string
}

export async function criarVacinacao(payload: CreateItemPayload): Promise<string> {
  const columnValues: Record<string, unknown> = {
    // Colunas de Texto
    "text_mm278rts":  payload.contrato,     // Contrato
    "text_mm27t2ky":  payload.unidade,      // Unidade
    "ID_DA_OBSERVACAO": payload.observacao, // ⚠️ SUBSTITUA PELO ID REAL DA COLUNA DE OBSERVAÇÃO

    // Colunas de Status
    "color_mm27z9q9": { label: payload.area },        // Área (PONTA / ADM)
    "color_mm27vwvb": { label: payload.statusH1N1 },  // H1N1
    "color_mm275ygv": { label: payload.status1Dose }, // 1ª Dose
    "color_mm27ya8f": { label: payload.status2Dose }, // 2ª Dose
  }

  // Linkando a vacina com a ficha de atestado do funcionário (se a coluna existir)
  if (payload.colaboradorId) {
    // Caso crie a coluna Connect Boards no futuro, substitua "connect_boards" pelo ID real dela
    columnValues["connect_boards"] = {
      item_ids: [parseInt(payload.colaboradorId, 10)].filter(Boolean)
    }
  }

  const mutation = `
    mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        item_name: $itemName
        column_values: $columnValues
        create_labels_if_missing: true
      ) {
        id
      }
    }
  `

  const data = await mondayGQL<{ create_item: { id: string } }>(mutation, {
    boardId: '18407626532', // Board Novo de Vacinas
    itemName: payload.colaboradorName,
    columnValues: JSON.stringify(columnValues),
  })

  return data?.create_item?.id ?? ''
}

// ─── Board 2: Atualizar Vacinação Existente (Edição Rápida) ────────────────────

interface UpdateVacinacaoPayload {
  itemId: string
  area: string
  statusH1N1: string
  status1Dose: string
  status2Dose: string
}

export async function atualizarVacinacao(payload: UpdateVacinacaoPayload): Promise<void> {
  const columnValues = {
    // Usando os IDs reais confirmados
    'color_mm27z9q9': { label: payload.area },
    'color_mm27vwvb': { label: payload.statusH1N1 },
    'color_mm275ygv': { label: payload.status1Dose },
    'color_mm27ya8f': { label: payload.status2Dose },
  }

  const mutation = `
    mutation UpdateItem($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  await mondayGQL(mutation, {
    boardId: BOARD_DESTINO,
    itemId: payload.itemId,
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