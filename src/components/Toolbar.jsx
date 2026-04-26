import { useEffect, useRef } from 'react'

export default function Toolbar({
  query,
  onQueryChange,
  matchCount,
  matchIndex,
  onPrevMatch,
  onNextMatch,
  onExpandAll,
  onCollapseAll,
  onCopyAll,
  onDownload,
  onClear,
  stats,
  theme,
  onToggleTheme,
  viewMode,
  onViewModeChange,
  onResetPath,
}) {
  const searchRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      // Cmd/Ctrl+F focuses search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      // Escape clears the search
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        onQueryChange('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onQueryChange])

  return (
    <div className="jv-toolbar">
      <div className="jv-toolbar__group jv-toolbar__group--search">
        <div className="jv-search">
          <span className="jv-search__icon">⌕</span>
          <input
            ref={searchRef}
            type="text"
            className="jv-search__input"
            placeholder="Search keys, values…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) onPrevMatch()
                else onNextMatch()
              }
            }}
          />
          {query && (
            <span className="jv-search__count">
              {matchCount > 0 ? `${matchIndex + 1} / ${matchCount}` : '0'}
            </span>
          )}
          {query && (
            <>
              <button className="jv-search__nav" onClick={onPrevMatch} disabled={matchCount === 0} title="Previous match (Shift+Enter)">
                ↑
              </button>
              <button className="jv-search__nav" onClick={onNextMatch} disabled={matchCount === 0} title="Next match (Enter)">
                ↓
              </button>
            </>
          )}
        </div>
      </div>

      <div className="jv-toolbar__group">
        {viewMode === 'explorer' && (
          <button className="btn btn--sm btn--primary" onClick={onResetPath} title="Go to Root">
            ⌂ Home
          </button>
        )}
        <button className="btn btn--sm" onClick={onExpandAll} title="Expand all">
          Expand
        </button>
        <button className="btn btn--sm" onClick={onCollapseAll} title="Collapse all">
          Collapse
        </button>
        <button className="btn btn--sm" onClick={onCopyAll} title="Copy formatted JSON">
          Copy
        </button>
        <button className="btn btn--sm" onClick={onDownload} title="Download as .json">
          Download
        </button>
        <button className="btn btn--sm btn--ghost" onClick={onClear} title="Clear and load new JSON">
          ⌫ Clear
        </button>
      </div>

      <div className="jv-toolbar__group jv-toolbar__group--right">
        <div className="jv-view-toggle">
          <button
            className={`btn btn--sm ${viewMode === 'tree' ? 'btn--active' : ''}`}
            onClick={() => onViewModeChange('tree')}
            title="Tree View"
          >
            Tree
          </button>
          <button
            className={`btn btn--sm ${viewMode === 'explorer' ? 'btn--active' : ''}`}
            onClick={() => onViewModeChange('explorer')}
            title="Explorer View"
          >
            Explorer
          </button>
        </div>

        {stats && (
          <div className="jv-stats jv-stats--desktop">
            <span><b>{stats.keys.toLocaleString()}</b> keys</span>
            <span className="jv-stats__sep">·</span>
            <span><b>{stats.objects.toLocaleString()}</b> objects</span>
            <span className="jv-stats__sep">·</span>
            <span><b>{stats.arrays.toLocaleString()}</b> arrays</span>
          </div>
        )}
        <button className="btn btn--icon" onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </div>
  )
}
