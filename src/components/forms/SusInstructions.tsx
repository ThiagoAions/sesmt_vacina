import { ExternalLink, Smartphone, QrCode, Download, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    icon: Smartphone,
    title: 'Baixe o app "Meu SUS Digital"',
    desc: 'Disponível na App Store e Google Play. Faça login com sua conta Gov.br.',
    link: null,
  },
  {
    icon: QrCode,
    title: 'Acesse o ConecteSUS pelo navegador',
    desc: 'Alternativa ao app: acesse pelo site oficial do ConecteSUS.',
    link: { label: 'Abrir ConecteSUS', url: 'https://conectesus-paciente.saude.gov.br/' },
  },
  {
    icon: CheckCircle2,
    title: 'Vá em "Vacinas"',
    desc: 'No menu principal do app ou site, toque em "Vacinas" para ver seu histórico.',
    link: null,
  },
  {
    icon: Download,
    title: 'Baixe o Certificado Digital',
    desc: 'Selecione "Certificado Nacional de Vacinação" e exporte como PDF.',
    link: null,
  },
]

export function SusInstructions() {
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(0,229,255,.05),rgba(0,230,118,.03))',
      border: '1px solid rgba(0,229,255,.12)', borderRadius: 14, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Smartphone size={15} color="var(--cyan)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
          Como emitir seu cartão digital
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <s.icon size={13} color="var(--cyan)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {i + 1}. {s.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                {s.desc}
              </p>
              {s.link && (
                <a
                  href={s.link.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: 'var(--cyan)', marginTop: 5, textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  {s.link.label} <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '10px 14px', background: 'rgba(0,230,118,.07)',
        border: '1px solid rgba(0,230,118,.2)', borderRadius: 9, marginTop: 2,
      }}>
        <p style={{ fontSize: 11, color: '#6EE7B7', lineHeight: 1.6 }}>
          ✅ <strong>Dica:</strong> O PDF do cartão digital é aceito como comprovante. Certifique-se de que todas as vacinas estão listadas antes de fazer o upload.
        </p>
      </div>
    </div>
  )
}
