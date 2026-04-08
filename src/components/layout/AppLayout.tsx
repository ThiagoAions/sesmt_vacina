import React, { useState, createContext } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'

// Criamos um contexto global para o menu
export const SidebarContext = createContext({
  isOpen: false,
  toggle: () => {},
  close: () => {}
})

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggle: () => setIsOpen(!isOpen), 
      close: () => setIsOpen(false) 
    }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Sidebar />
        
        {/* Fundo escuro que aparece no telemóvel quando o menu abre */}
        {isOpen && (
          <div 
            onClick={() => setIsOpen(false)}
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'rgba(0,0,0,0.6)', zIndex: 35, 
              backdropFilter: 'blur(3px)' 
            }}
          />
        )}

        <main className="app-main" style={{ 
          flex: 1, minHeight: '100vh', 
          display: 'flex', flexDirection: 'column', 
          overflowX: 'hidden' 
        }}>
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  )
}