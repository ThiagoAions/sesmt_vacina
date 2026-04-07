import { motion } from 'motion/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'success'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,229,255,.07))',
    color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.35)',
    boxShadow: '0 0 20px rgba(0,229,255,.12)',
  },
  ghost: {
    background: 'rgba(255,255,255,.04)',
    color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)',
  },
  danger: {
    background: 'rgba(239,68,68,.1)',
    color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)',
  },
  success: {
    background: 'rgba(0,230,118,.1)',
    color: 'var(--green)', border: '1px solid rgba(0,230,118,.3)',
  },
}

const spinner: React.CSSProperties = {
  width: 13, height: 13, border: '2px solid currentColor',
  borderTopColor: 'transparent', borderRadius: '50%',
  animation: 'spin .6s linear infinite', display: 'inline-block',
}

export function Button({ variant = 'primary', loading, children, disabled, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? .55 : 1, outline: 'none',
    transition: 'all .15s ease', ...VARIANTS[variant], ...style,
  }

  const { type = 'button', onClick, className, title } = rest;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={className}
      title={title}
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.975 }}
      style={base}
      disabled={disabled || loading}
    >
      {loading && <span style={spinner} />}
      {children}
    </motion.button>
  )
}