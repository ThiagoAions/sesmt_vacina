import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { Lock, LogIn, AlertCircle, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/common/Button'

export function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(false)
    setLoading(true)

    // Simulate network delay to make the UI feel native and intentional
    await new Promise((r) => setTimeout(r, 600))

    if (login(password)) {
      navigate('/')
    } else {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'radial-gradient(ellipse at center, #1E2328 0%, #121619 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 100, height: 100,
          background: 'var(--cyan)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(0,229,255,.18), rgba(0,229,255,.08))',
            border: '1px solid rgba(0,229,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,229,255,.15)',
          }}>
            <Building2 size={26} color="var(--cyan)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Acesso Restrito
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            Painel Administrativo do SESMT. <br/> Insira a senha mestra para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                color={error ? 'var(--red)' : 'var(--text-muted)'} 
                style={{ position: 'absolute', top: 15, left: 16, transition: 'color .2s' }} 
              />
              <input
                type="password"
                placeholder="Senha de Acesso"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-input)'}`,
                  borderRadius: 14,
                  padding: '14px 16px 14px 44px',
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
                onFocus={(e) => { if (!error) e.target.style.borderColor = 'var(--border-active)' }}
                onBlur={(e) => { if (!error) e.target.style.borderColor = 'var(--border-input)' }}
              />
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 12, marginTop: 10, paddingLeft: 4 }}
                >
                  <AlertCircle size={14} /> Senha incorreta. Tente novamente.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{ width: '100%', padding: '14px 24px', fontSize: 15, borderRadius: 14, marginTop: 8 }}
          >
            {loading ? 'Validando...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Entrar no Dashboard <LogIn size={18} />
              </span>
            )}
          </Button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Ambiente exclusivo para gestão de saúde corporativa. <br/>
            Para cadastrar suas vacinas, acesse o <a href="/form" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>formulário público</a>.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
