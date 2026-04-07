export function ZeGotinha() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '20px 16px',
      background: 'linear-gradient(135deg,rgba(0,229,255,.06),rgba(0,230,118,.04))',
      border: '1px solid rgba(0,229,255,.15)', borderRadius: 14,
    }}>
      {/* Zé Gotinha — iconic blue water drop mascot of Brazil's vaccination campaigns */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Body: water drop shape */}
        <svg viewBox="0 0 80 90" width="80" height="90" xmlns="http://www.w3.org/2000/svg" aria-label="Zé Gotinha">
          {/* Drop shadow */}
          <ellipse cx="40" cy="85" rx="22" ry="5" fill="rgba(0,0,0,.3)" />
          {/* Body */}
          <path
            d="M40 4 C40 4 10 42 10 60 A30 30 0 0 0 70 60 C70 42 40 4 40 4Z"
            fill="#1565C0" stroke="#0D47A1" strokeWidth="1.5"
          />
          {/* Shine */}
          <ellipse cx="28" cy="42" rx="7" ry="11" fill="rgba(255,255,255,.22)" transform="rotate(-20,28,42)" />
          {/* Eyes */}
          <circle cx="31" cy="58" r="5.5" fill="white" />
          <circle cx="49" cy="58" r="5.5" fill="white" />
          <circle cx="32.5" cy="59" r="3"  fill="#1A237E" />
          <circle cx="50.5" cy="59" r="3"  fill="#1A237E" />
          <circle cx="33.5" cy="57.5" r="1" fill="white" />
          <circle cx="51.5" cy="57.5" r="1" fill="white" />
          {/* Smile */}
          <path d="M32 67 Q40 74 48 67" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Arm left */}
          <path d="M14 56 Q6 50 10 44" stroke="#1565C0" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Arm right — raised & waving */}
          <path d="M66 56 Q76 44 70 36" stroke="#1565C0" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Syringe in right hand */}
          <rect x="67" y="28" width="12" height="4" rx="2" fill="#E0E0E0" />
          <rect x="79" y="29" width="6" height="2" rx="1" fill="#9E9E9E" />
          <rect x="71" y="26" width="2" height="3" rx="1" fill="#B0BEC5" />
          {/* Feet */}
          <ellipse cx="33" cy="81" rx="8" ry="4" fill="#1565C0" />
          <ellipse cx="47" cy="81" rx="8" ry="4" fill="#1565C0" />
          {/* Cap/hat */}
          <ellipse cx="40" cy="22" rx="14" ry="5" fill="#0D47A1" />
          <rect x="34" y="13" width="12" height="10" rx="3" fill="#0D47A1" />
          <text x="40" y="22" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">SUS</text>
        </svg>
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
