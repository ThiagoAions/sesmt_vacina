import { useRef, useState } from 'react'
import { Upload, FileCheck, X } from 'lucide-react'

interface FileDropzoneProps {
  label: string
  accept: string
  file: File | null
  onChange: (f: File | null) => void
  error?: string
}

export function FileDropzone({ label, accept, file, onChange, error }: FileDropzoneProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const border = error
    ? 'rgba(239,68,68,.4)'
    : drag
    ? 'var(--cyan)'
    : 'rgba(255,255,255,.1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: error ? 'var(--red)' : 'var(--text-muted)' }}>
        {label}
      </label>

      {file ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(0,230,118,.07)', border: '1px solid rgba(0,230,118,.25)',
          borderRadius: 9, padding: '10px 14px',
        }}>
          <FileCheck size={16} color="var(--green)" />
          <span style={{ fontSize: 12, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false)
            const f = e.dataTransfer.files[0]
            if (f) onChange(f)
          }}
          style={{
            border: `1.5px dashed ${border}`,
            borderRadius: 9, padding: '22px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer', transition: 'border-color .15s, background .15s',
            background: drag ? 'rgba(0,229,255,.04)' : 'var(--bg-input)',
          }}
        >
          <Upload size={20} color={drag ? 'var(--cyan)' : 'var(--text-secondary)'} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Clique ou arraste o arquivo aqui
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {accept.replace(/\./g, '').toUpperCase()} · Máx. 10MB
          </span>
        </div>
      )}

      <input
        ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}
