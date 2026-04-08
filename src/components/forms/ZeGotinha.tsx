import zeGotinhaPng from '../../assets/ze-gotinha-real.png';

export function ZeGotinha() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '24px 16px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(0,229,255,.15)', borderRadius: 14,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Zé Gotinha — iconic white mascot of Brazil's vaccination campaigns */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: 160,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img 
          src={zeGotinhaPng} 
          alt="Zé Gotinha" 
          style={{ 
            height: '100%', 
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
          }} 
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>Zé Gotinha diz:</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6, maxWidth: 180 }}>
          "Vacina no braço é saúde no trabalho! Não esqueça de registrar sua dose. 💉"
        </p>
      </div>
    </div>
  )
}
