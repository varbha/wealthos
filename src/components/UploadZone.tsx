import { useRef, useState } from 'react'

interface Props {
  label: string
  accept: string
  color: string
  onFile: (file: File, buffer: ArrayBuffer) => Promise<void>
}

type Status = 'idle' | 'processing' | 'success' | 'error'

export default function UploadZone({ label, accept, color, onFile }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handle(file: File) {
    setStatus('processing')
    setMessage('')
    try {
      const buffer = await file.arrayBuffer()
      await onFile(file, buffer)
      setStatus('success')
      setMessage(`Parsed ${file.name}`)
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handle(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f) }}
      />
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <span className="text-lg" style={{ color }}>↑</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-xs text-gray-400 mt-1">drag & drop or click to browse</p>

      {status === 'processing' && (
        <p className="text-xs text-blue-500 mt-3 animate-pulse">Processing…</p>
      )}
      {status === 'success' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-3">✓ {message}</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">✗ {message}</p>
      )}
    </div>
  )
}
