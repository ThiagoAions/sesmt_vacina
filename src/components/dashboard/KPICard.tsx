import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

interface KPICardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color?: string
  trend?: string
  trendUp?: boolean
  loading?: boolean
}

export function KPICard({ label, value, icon: Icon, color = 'var(--cyan)', trend, trendUp, loading }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)', borderRadius: 14,
        padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 16,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 11, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${color}14`,
      }}>
        <Icon size={20} color={color} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </p>
        {loading ? (
          <div style={{ height: 28, width: 60, background: 'rgba(255,255,255,.06)', borderRadius: 6, marginTop: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
        ) : (
          <h3 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
            {value}
          </h3>
        )}
        {trend && (
          <p style={{ fontSize: 11, marginTop: 5, color: trendUp ? 'var(--green)' : 'var(--red)' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </motion.div>
  )
}
