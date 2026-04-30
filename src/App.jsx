import { useCallback, useEffect, useMemo, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import InputPanel from './components/InputPanel'
import JsonViewer from './components/JsonViewer'
import ExplorerView from './components/ExplorerView'
import Toolbar from './components/Toolbar'
import Toast from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { computeStats, formatBytes, searchJson, getAncestorPaths } from './utils/jsonUtils'
import './App.css'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [data, setData] = useState(null)
  const [rawSize, setRawSize] = useState(0)
  const [query, setQuery] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const [expandSignal, setExpandSignal] = useState(0)
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [toast, setToast] = useState('')
  const [hoverPath, setHoverPath] = useState('')
  const [viewMode, setViewMode] = useState('tree') // 'tree' | 'explorer'
  const [explorerPath, setExplorerPath] = useState('')

  const handleLoad = useCallback((parsed, raw) => {
    setData(parsed)
    setRawSize(new Blob([raw]).size)
    setQuery('')
    setMatchIndex(0)
  }, [])

  const handleClear = useCallback(() => {
    setData(null)
    setRawSize(0)
    setQuery('')
    setMatchIndex(0)
    setExplorerPath('')
  }, [])

  const stats = useMemo(() => {
    if (data === null) return null
    const s = computeStats(data)
    return { ...s, size: formatBytes(rawSize) }
  }, [data, rawSize])

  // Compute matches (debounced via state pattern — synchronous since searchJson is iterative + capped)
  const matches = useMemo(() => {
    if (!query || data === null) return []
    return searchJson(data, query, { caseSensitive: false, limit: 1000 })
  }, [query, data])

  const matchPaths = useMemo(() => new Set(matches), [matches])

  // Reset match index when query/results change
  useEffect(() => {
    setMatchIndex(0)
  }, [matches])

  // Compute the path to scroll/highlight, and ancestors to auto-expand
  const focusedMatchPath = matches[matchIndex] || null
  const expandToPaths = useMemo(() => {
    const set = new Set()
    if (!focusedMatchPath) return set
    const ancestors = getAncestorPaths(focusedMatchPath)
    for (const a of ancestors) set.add(a)
    return set
  }, [focusedMatchPath])

  const focusedSet = useMemo(() => (focusedMatchPath ? new Set([focusedMatchPath]) : new Set()), [focusedMatchPath])

  const onPrevMatch = () => {
    if (matches.length === 0) return
    setMatchIndex((i) => (i - 1 + matches.length) % matches.length)
  }
  const onNextMatch = () => {
    if (matches.length === 0) return
    setMatchIndex((i) => (i + 1) % matches.length)
  }

  const showToast = useCallback((msg) => setToast(msg), [])

  const onCopyPath = useCallback(
    async (path) => {
      try {
        await navigator.clipboard.writeText(path)
        showToast(`Copied  ${path}`)
      } catch {
        showToast('Copy failed')
      }
    },
    [showToast]
  )

  const onCopyAll = useCallback(async () => {
    if (data === null) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      showToast('Copied formatted JSON to clipboard')
    } catch {
      showToast('Copy failed')
    }
  }, [data, showToast])

  const onDownload = useCallback(() => {
    if (data === null) return
    const text = JSON.stringify(data, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  return (
    <div className="jv-app">
      <Analytics />
      <header className="jv-header">
        <a className="jv-header__brand" href="https://json-viewer-explorer.vercel.app/">

          <span className="jv-header__mark">{'{ }'}</span>
          <span className="jv-header__name">
            <em>JSON</em> Tree Viewer
          </span>

        </a>
        <div className="jv-header__meta">
          <span className="jv-header__pill">v1.0</span>
          <a
            className="jv-header__link"
            href="https://github.com/mankarsandesh/json-viewer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
          >
            ↗ source
          </a>
        </div>
      </header>

      {data !== null ? (
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          matchCount={matches.length}
          matchIndex={matchIndex}
          onPrevMatch={onPrevMatch}
          onNextMatch={onNextMatch}
          onExpandAll={() => setExpandSignal((s) => s + 1)}
          onCollapseAll={() => setCollapseSignal((s) => s + 1)}
          onCopyAll={onCopyAll}
          onDownload={onDownload}
          onClear={handleClear}
          stats={stats}
          theme={theme}
          onToggleTheme={toggleTheme}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onResetPath={() => setExplorerPath('')}
        />
      ) : (
        <div className="jv-toolbar-placeholder" />
      )}

      <main className={`jv-stage ${data === null ? '' : (viewMode === 'tree' ? 'jv-stage--tree' : 'jv-stage--explorer')}`} onMouseMove={(e) => {
        const el = e.target.closest?.('[data-path]')
        if (el) setHoverPath(el.dataset.path || '')
      }}>
        {data === null ? (
          <InputPanel onLoad={handleLoad} />
        ) : viewMode === 'tree' ? (
          <JsonViewer
            data={data}
            query={query}
            matchPaths={focusedSet}
            expandSignal={expandSignal}
            collapseSignal={collapseSignal}
            expandToPaths={expandToPaths}
            onCopy={onCopyPath}
          />
        ) : (
          <ExplorerView
            data={data}
            path={explorerPath}
            onNavigate={setExplorerPath}
            onCopy={onCopyPath}
            query={query}
          />
        )}
      </main>

      {data !== null ? (
        <footer className="jv-footer">
          <span className="jv-footer__label">Path</span>
          <code className="jv-footer__path">{focusedMatchPath || hoverPath || '$'}</code>
          <span className="jv-footer__hint">⌘/Ctrl+F to search · Alt+Click toggle to recurse</span>
          <span className="jv-footer__credit">Made with <span className="jv-footer__heart">❤️</span> by Sandesh</span>
        </footer>
      ) : (
        <footer className="jv-footer">
          <span className="jv-footer__credit" style={{ marginLeft: 'auto' }}>Made with <span className="jv-footer__heart">❤️</span> by Sandesh</span>
        </footer>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
