import { useState, useEffect, useCallback } from 'react'
import { fetchVacinacoes, computeStats } from '@/api/monday'
import type { VacinacaoItem, DashboardStats } from '@/types'

export function useDashboard() {
  const [vacinacoes, setVacinacoes] = useState<VacinacaoItem[]>([])
  const [stats, setStats]           = useState<DashboardStats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchVacinacoes()
      .then((items) => {
        setVacinacoes(items)
        setStats(computeStats(items))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return { vacinacoes, stats, loading, error, refetch: load }
}