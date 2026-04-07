import { useState, useEffect } from 'react'
import { fetchColaboradores } from '@/api/monday'
import type { Colaborador } from '@/types'

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetchColaboradores()
      .then(setColaboradores)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Derive unique lists for dropdowns
  const contratos = [...new Set(colaboradores.map((c) => c.contrato).filter(Boolean))].sort()
  const unidades  = [...new Set(colaboradores.map((c) => c.unidade).filter(Boolean))].sort()

  return { colaboradores, contratos, unidades, loading, error, refetch: load }
}