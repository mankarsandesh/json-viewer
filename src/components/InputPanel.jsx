import { useRef, useState } from 'react'
import { SAMPLE_JSON } from '../utils/jsonUtils'

export default function InputPanel({ onLoad, onError }) {
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState(null)
  const fileInputRef = useRef(null)

  const tryParse = (raw) => {
    if (!raw.trim()) {
      setParseError('Paste JSON, drop a file, or load the sample to begin.')
      return
    }
    try {
      const parsed = JSON.parse(raw)
      setParseError(null)
      onLoad(parsed, raw)
    } catch (err) {
      const msg = err?.message || 'Invalid JSON'
      setParseError(msg)
      onError?.(msg)
    }
  }

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result || '')
      setText(raw.length > 200_000 ? raw.slice(0, 200_000) + '\n\n/* …truncated for editor display, full file parsed */' : raw)
      tryParse(raw)
    }
    reader.onerror = () => setParseError('Could not read the file.')
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleSample = () => {
    const raw = JSON.stringify(SAMPLE_JSON, null, 2)
    setText(raw)
    tryParse(raw)
  }

  return (
    <div
      className={`jv-input${dragOver ? ' jv-input--drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="jv-input__hero">
        <h1 className="jv-input__title">
          <em>Inspect</em> JSON, beautifully.
        </h1>
        <p className="jv-input__subtitle">
          Paste, drop a file, or load the sample. Built for large documents — collapsible tree, search, lazy rendering.
        </p>
      </div>

      <div className="jv-input__editor-wrap">
        <textarea
          className="jv-input__editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`{\n  "paste": "your JSON here",\n  "or": ["drop a file", "click sample"]\n}`}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        {dragOver && (
          <div className="jv-input__drop-overlay">
            <span>Drop JSON file to parse</span>
          </div>
        )}
      </div>

      {parseError && <div className="jv-input__error">⚠ {parseError}</div>}

      <div className="jv-input__actions">
        <button className="btn btn--primary" onClick={() => tryParse(text)}>
          Parse JSON →
        </button>
        <button className="btn" onClick={() => fileInputRef.current?.click()}>
          Upload file
        </button>
        <button className="btn btn--ghost" onClick={handleSample}>
          Load sample
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json,text/plain"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}
