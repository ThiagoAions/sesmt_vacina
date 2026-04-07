import type { Colaborador, VacinacaoItem, MondayItem, DashboardStats } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = 'https://api.monday.com/v2'
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

// ─── Board 1: Fetch Colaboradores ─────────────────────────────────────────────

/**
 * Fetches all items from Board 1 and maps them to Colaborador objects.
 * Column IDs are discovered dynamically by looking for partial matches.
 */
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
      // Use flexible matching since column IDs can vary
      const get = (patterns: string[]) => {
        for (const p of patterns) {
          const cv = item.column_values.find(
            (c) => c.id === p || c.id.toLowerCase().includes(p.toLowerCase()),
          )
          if (cv?.text) return cv.text
        }
        return ''
      }

      return {
        id: item.id,
        name: item.name,
        contrato: get(['contrato', 'contract', 'text']),
        unidade: get(['unidade', 'unit', 'text0', 'text1']),
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
  }>(query, { boardId: BOARD_DESTINO })

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
      contrato: get(['text', 'contrato']),
      unidade: get(['text0', 'unidade']),
      area: (get(['text1', 'area']).toUpperCase() as 'PONTA' | 'ADM') || 'PONTA',
      statusH1N1: (get(['status', 'h1n1']) || 'Pendente') as VacinacaoItem['statusH1N1'],
      status1Dose: (get(['status4', '1dose', 'dose1']) || 'Pendente') as VacinacaoItem['status1Dose'],
      status2Dose: (get(['status5', '2dose', 'dose2']) || 'Pendente') as VacinacaoItem['status2Dose'],
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
    if (v.statusH1N1 !== 'Vacinado') semH1N1++
    if (v.status1Dose === 'Atrasado') atrasados1Dose++
    if (v.status2Dose === 'Atrasado') atrasados2Dose++

    const regular =
      v.statusH1N1 === 'Vacinado' &&
      v.status1Dose === 'Vacinado' &&
      v.status2Dose === 'Vacinado'

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
  colaboradorId: string   // Board 1 item ID for Connect Boards
  contrato: string
  unidade: string
  area: string
  statusH1N1: string
  status1Dose: string
  status2Dose: string
}

export async function criarVacinacao(payload: CreateItemPayload): Promise<string> {
  const columnValues: Record<string, unknown> = {
    // Status columns — use label objects
    status:  { label: payload.statusH1N1 },
    status4: { label: payload.status1Dose },
    status5: { label: payload.status2Dose },
    // Text columns
    text:  payload.contrato,
    text0: payload.unidade,
    text1: payload.area,
    // Connect Boards — link to colaborador item on Board 1
    connect_boards: {
      item_ids: [parseInt(payload.colaboradorId, 10)].filter(Boolean),
    },
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
    boardId: BOARD_DESTINO,
    itemName: payload.colaboradorName,
    columnValues: JSON.stringify(columnValues),
  })

  return data?.create_item?.id ?? ''
}

// ─── Board 2: Upload File to an Item Column ───────────────────────────────────

export async function uploadFile(
  itemId: string,
  columnId: string,
  file: File,
): Promise<void> {
  const formData = new FormData()
  formData.append(
    'query',
    `mutation ($file: File!) {
       add_file_to_column(item_id: ${itemId}, column_id: "${columnId}", file: $file) {
         id
       }
     }`,
  )
  formData.append('variables[file]', file, file.name)

  await fetch(`${API_URL}/file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: formData,
  })
}