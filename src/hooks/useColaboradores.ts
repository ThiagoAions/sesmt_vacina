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
  
  // 🧹 FAXINA NOS DADOS: Filtra as "sujeiras" que vêm do Monday
  const lixo = ['JAN', 'JANEIRO', 'FEV', 'FEVEREIRO', 'MAR', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO', 'PARADO']
  
  const unidades = [...new Set(colaboradores.map((c) => c.unidade).filter(Boolean))]
    .filter((u) => {
      const texto = u.toUpperCase().trim()
      // Só deixa passar se o texto NÃO estiver na lista de lixo
      return !lixo.includes(texto)
    })
    .sort()

  return { colaboradores, contratos, unidades, loading, error, refetch: load }
}