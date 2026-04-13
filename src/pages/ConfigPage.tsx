import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Moon, Sun, Bell, Shield, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function ConfigPage() {
  const { changePassword } = useAuth()
  
  // Lógica do Modo Claro/Escuro
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains('light-theme') ? false : true
  })

  const [notificacoes, setNotificacoes] = useState(true)
  
  // Lógica de Senha
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)

  const toggleTheme = () => {
    const novoModoEscuro = !isDark
    setIsDark(novoModoEscuro)
    if (novoModoEscuro) {
      document.body.classList.remove('light-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.add('light-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme')
      setIsDark(false)
    } else if (savedTheme === 'dark') {
      document.body.classList.remove('light-theme')
      setIsDark(true)
    }
  }, [])

  const handleChangePassword = (e: any) => {
    e.preventDefault()
    setPwdError('')
    
    if (newPwd.length < 6) {
      setPwdError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('As senhas novas não coincidem.')
      return
    }
    
    const success = changePassword(oldPwd, newPwd)
    if (success) {
      setPwdSuccess(true)
      setTimeout(() => {
        setPwdSuccess(false)
        setShowPasswordModal(false)
        setOldPwd(''); setNewPwd(''); setConfirmPwd('')
      }, 2000)
    } else {
      setPwdError('A senha atual está incorreta.')
    }
  }

  const SettingRow = ({ icon: Icon, title, description, control }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,229,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,229,255,.2)' }}>
          <Icon size={20} color="var(--cyan)" />
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>
      <div>{control}</div>
    </div>
  )

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div onClick={onChange} style={{ width: 44, height: 24, background: checked ? 'var(--cyan)' : 'var(--bg-input)', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all .3s', border: checked ? 'none' : '1px solid var(--border-subtle)' }}>
      <motion.div layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: checked ? 23 : 3, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
    </div>
  )

  return (
    <>
      <Header title="Configurações" subtitle="Preferências do sistema e personalização" />
      <div className="content-padding" style={{ padding: 28 }}>
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '10px 28px' }}>
          
          <SettingRow 
            icon={isDark ? Moon : Sun} 
            title="Tema do Sistema" 
            description="Alterne entre o Modo Claro e o Modo Escuro." 
            control={<ToggleSwitch checked={isDark} onChange={toggleTheme} />} 
          />

          <SettingRow 
            icon={Bell} 
            title="Notificações" 
            description="Receba alertas quando houver novos cadastros." 
            control={<ToggleSwitch checked={notificacoes} onChange={() => setNotificacoes(!notificacoes)} />} 
          />

          <SettingRow 
            icon={Shield} 
            title="Senha do Painel" 
            description="A senha de acesso administrativo poderá ser alterada aqui." 
            control={<button onClick={() => setShowPasswordModal(true)} style={{ background: 'transparent', border: '1px solid var(--border-active)', color: 'var(--cyan)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Alterar Senha</button>} 
          />

        </div>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--bg-page)', borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}> <Shield size={18} color="var(--cyan)" /> Alterar Senha</h3>
                <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              {pwdSuccess ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <CheckCircle2 size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Senha Alterada!</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>A sua senha do painel SESMT foi atualizada com sucesso.</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input label="Senha Atual *" type="password" placeholder="Digite a senha atual" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
                    <Input label="Nova Senha *" type="password" placeholder="Digite a nova senha" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    <Input label="Confirmar Nova Senha *" type="password" placeholder="Repita a nova senha" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                  </div>

                  {pwdError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 12, marginTop: 16, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                      <AlertCircle size={14} /> {pwdError}
                    </div>
                  )}

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
                    <Button type="submit" variant="primary">Confirmar Alteração</Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
