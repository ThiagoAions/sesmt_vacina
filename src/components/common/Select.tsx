import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, style, ...rest }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.8px',
        textTransform: 'uppercase', color: error ? 'var(--red)' : 'var(--text-muted)',
      }}>
        {label}
      </label>
      <select
        {...rest}
        style={{
          background: 'rgba(14,18,20,.95)',
          border: `1px solid ${error ? 'rgba(239,68,68,.4)' : 'var(--border-input)'}`,
          borderRadius: 8, padding: '10px 14px', fontSize: 13,
          color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
          outline: 'none', width: '100%', cursor: 'pointer',
          transition: 'border-color .15s, box-shadow .15s', ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--border-active)'
          e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,.08)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(239,68,68,.4)' : 'var(--border-input)'
          e.target.style.boxShadow = 'none'
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}