import { useState, useEffect } from 'react'
import { fetchVacinacoes } from '@/api/monday'

/**
 * Hook que lê o Board 2 (Gestão de Vacinação) e extrai listas únicas
 * de Cargos, Contratos e Unidades já cadastrados.
 * 
 * Filtra por área de atuação se `areaSelected` for informada.
 */
export function useFormOptions(areaSelected?: string) {
  const [cargos, setCargos] = useState<string[]>([])
  const [contratos, setContratos] = useState<string[]>([])
  const [unidades, setUnidades] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchVacinacoes()
      .then((items) => {
        // Filtrar itens pela área selecionada
        const filteredItems = areaSelected
          ? items.filter(i => i.area === areaSelected)
          : items

        // Extrai valores únicos, limpa vazios e ordena
        const uniqueCargos = [...new Set(filteredItems.map(i => i.cargo).filter(Boolean))].sort()
        const uniqueContratos = [...new Set(filteredItems.map(i => i.contrato).filter(Boolean))].sort()
        const uniqueUnidades = [...new Set(filteredItems.map(i => i.unidade).filter(Boolean))].sort()

        setCargos(uniqueCargos)
        setContratos(uniqueContratos)
        setUnidades(uniqueUnidades)
      })
      .catch((err) => {
        console.error('Erro ao carregar opções do formulário:', err)
      })
      .finally(() => setLoading(false))
  }, [areaSelected])

  return { cargos, contratos, unidades, loading }
}
