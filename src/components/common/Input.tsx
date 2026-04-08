import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export function Input({ label, error, hint, icon, style, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.8px',
        textTransform: 'uppercase', color: error ? 'var(--red)' : 'var(--text-muted)',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 14, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}
        <input
          {...rest}
          style={{
            background: 'var(--bg-input)',
            border: `1px solid ${error ? 'rgba(239,68,68,.4)' : 'var(--border-input)'}`,
            borderRadius: 8, padding: icon ? '10px 14px 10px 40px' : '10px 14px', fontSize: 13,
            color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
            outline: 'none', width: '100%',
            transition: 'border-color .15s, box-shadow .15s',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--border-active)'
            e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,.08)'
            const iconEl = e.target.previousElementSibling as HTMLElement
            if (iconEl) iconEl.style.color = 'var(--cyan)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,.4)' : 'var(--border-input)'
            e.target.style.boxShadow = 'none'
            const iconEl = e.target.previousElementSibling as HTMLElement
            if (iconEl) iconEl.style.color = 'var(--text-muted)'
          }}
        />
      </div>
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}