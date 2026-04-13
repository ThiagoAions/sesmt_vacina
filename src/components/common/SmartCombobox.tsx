import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Plus, Check, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface SmartComboboxProps {
  label: string
  placeholder?: string
  value: string
  options: string[]
  onChange: (value: string) => void
  error?: string
  /** If true, the typed value is auto-uppercased */
  uppercase?: boolean
}

/**
 * SmartCombobox — Combobox inteligente com busca, seleção e "Adicionar Novo".
 * 
 * Mobile-first: botões grandes, dropdown com scroll suave,
 * destaque visual no item selecionado.
 * 
 * "Modo Aprendizado": se o valor digitado não existe na lista,
 * aparece "➕ Adicionar <valor>" — ao clicar, o valor é usado.
 * Na próxima leitura do Monday, ele já aparece na lista.
 */
export function SmartCombobox({
  label,
  placeholder = 'Selecione ou digite...',
  value,
  options,
  onChange,
  error,
  uppercase = false,
}: SmartComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Normalize for accent-insensitive search
  const removeAcentos = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const filtered = useMemo(() => {
    const query = removeAcentos(search.toLowerCase().trim())
    if (!query) return options
    return options.filter(o => removeAcentos(o.toLowerCase()).includes(query))
  }, [options, search])

  const exactMatch = useMemo(() => {
    const query = search.trim().toLowerCase()
    return options.some(o => o.toLowerCase() === query)
  }, [options, search])

  const showAddNew = search.trim().length > 1 && !exactMatch

  const handleSelect = (val: string) => {
    onChange(val)
    setSearch('')
    setIsOpen(false)
  }

  const handleAddNew = () => {
    const newVal = uppercase ? search.trim().toUpperCase() : search.trim()
    onChange(newVal)
    setSearch('')
    setIsOpen(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setSearch('')
    // Focus the search input after the dropdown opens
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Label */}
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.8px',
        textTransform: 'uppercase',
        color: error ? 'var(--red)' : 'var(--text-muted)',
      }}>
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%',
          background: 'var(--bg-input)',
          border: `1px solid ${error ? 'rgba(239,68,68,.4)' : isOpen ? 'var(--border-active)' : 'var(--border-input)'}`,
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: 14,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'border-color .15s, box-shadow .15s',
          boxShadow: isOpen ? '0 0 0 3px rgba(0,229,255,.08)' : 'none',
          textAlign: 'left',
        }}
      >
        <span style={{ 
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {value || placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ flexShrink: 0, display: 'flex' }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0, right: 0,
              zIndex: 100,
              background: '#0E1214',
              border: '1px solid var(--border-active)',
              borderRadius: 12,
              marginTop: 6,
              maxHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar ou digitar novo..."
                value={search}
                onChange={(e) => setSearch(uppercase ? e.target.value.toUpperCase() : e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  width: '100%',
                }}
              />
            </div>

            {/* Options list */}
            <div style={{
              overflowY: 'auto',
              padding: 4,
              flex: 1,
            }}>
              {filtered.length === 0 && !showAddNew && (
                <div style={{
                  padding: '16px 14px',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}>
                  Nenhuma opção encontrada
                </div>
              )}

              {filtered.map((opt) => {
                const isSelected = opt === value
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 8,
                      border: 'none',
                      background: isSelected ? 'rgba(0,229,255,.08)' : 'transparent',
                      color: isSelected ? 'var(--cyan)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontFamily: 'Inter, sans-serif',
                      textAlign: 'left',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(0,229,255,.08)' : 'transparent'
                    }}
                  >
                    {isSelected && <Check size={14} color="var(--cyan)" style={{ flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt}
                    </span>
                  </button>
                )
              })}

              {/* "+ Adicionar Novo" button */}
              {showAddNew && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: 8,
                    border: '1px dashed rgba(0,229,255,.3)',
                    background: 'rgba(0,229,255,.04)',
                    color: 'var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left',
                    marginTop: 4,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,229,255,.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,229,255,.04)'}
                >
                  <Plus size={14} />
                  Adicionar "{search.trim()}"
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}
