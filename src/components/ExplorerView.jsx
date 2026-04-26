import { useMemo } from 'react'
import { getValueType, isCollection, getKeys, buildPath, getValueAtPath } from '../utils/jsonUtils'

function Highlight({ text, query }) {
  if (!query) return <>{text}</>
  const str = String(text)
  const lower = str.toLowerCase()
  const q = query.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return <>{str}</>
  return (
    <>
      {str.slice(0, idx)}
      <mark className="jv-mark">{str.slice(idx, idx + q.length)}</mark>
      {str.slice(idx + q.length)}
    </>
  )
}

function Breadcrumbs({ path, onNavigate }) {
  const segments = useMemo(() => {
    const parts = [{ name: 'Root', path: '' }]
    if (!path) return parts

    let current = ''
    const re = /(\.[A-Za-z_$][A-Za-z0-9_$]*)|(\[\d+\])|(\["(?:[^"\\]|\\.)*"\])|^([A-Za-z_$][A-Za-z0-9_$]*)/g
    let m
    while ((m = re.exec(path)) !== null) {
      current += m[0]
      let name = m[0]
      if (name.startsWith('.')) name = name.slice(1)
      if (name.startsWith('["')) name = name.slice(2, -2).replace(/\\"/g, '"')
      parts.push({ name, path: current })
    }
    return parts
  }, [path])

  return (
    <nav className="jv-breadcrumbs" aria-label="Breadcrumbs">
      {segments.map((seg, i) => (
        <span key={seg.path} className="jv-breadcrumbs__item">
          <button
            className="jv-breadcrumbs__btn"
            onClick={() => onNavigate(seg.path)}
            disabled={i === segments.length - 1}
          >
            {seg.name}
          </button>
          {i < segments.length - 1 && <span className="jv-breadcrumbs__sep">/</span>}
        </span>
      ))}
    </nav>
  )
}

function Card({ nodeKey, value, path, onNavigate, onCopy, query }) {
  const type = getValueType(value)
  const collection = isCollection(value)
  const isArray = type === 'array'

  const handleClick = () => {
    if (collection) {
      onNavigate(path)
    }
  }

  const renderValue = () => {
    if (type === 'string') return <span className="jv-card__val jv-card__val--string">"<Highlight text={value} query={query} />"</span>
    if (type === 'number') return <span className="jv-card__val jv-card__val--number"><Highlight text={value} query={query} /></span>
    if (type === 'boolean') return <span className="jv-card__val jv-card__val--boolean">{String(value)}</span>
    if (type === 'null') return <span className="jv-card__val jv-card__val--null">null</span>
    if (collection) {
      const count = isArray ? value.length : Object.keys(value).length
      return (
        <span className="jv-card__val jv-card__val--meta">
          {count} {isArray ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}
        </span>
      )
    }
    return <span className="jv-card__val">{String(value)}</span>
  }

  return (
    <div
      className={`jv-card jv-card--${type} ${collection ? 'jv-card--clickable' : ''}`}
      onClick={handleClick}
      role={collection ? 'button' : 'article'}
      tabIndex={collection ? 0 : undefined}
    >
      <div className="jv-card__header">
        <span className={`jv-card__type jv-card__type--${type}`}>{type}</span>
        <button
          className="jv-card__copy"
          onClick={(e) => {
            e.stopPropagation()
            onCopy(path || '$')
          }}
          title="Copy path"
        >
          ⎘
        </button>
      </div>
      <div className="jv-card__body">
        <div className="jv-card__key" title={String(nodeKey)}>
          <Highlight text={nodeKey} query={query} />
        </div>
        <div className="jv-card__content">{renderValue()}</div>
      </div>
      {collection && <div className="jv-card__arrow">→</div>}
    </div>
  )
}

export default function ExplorerView({ data, path, onNavigate, onCopy, query }) {
  const currentData = useMemo(() => getValueAtPath(data, path), [data, path])
  const type = getValueType(currentData)
  const isColl = isCollection(currentData)

  const allKeys = useMemo(() => getKeys(currentData), [currentData])

  const filteredKeys = useMemo(() => {
    if (!query || !isColl) return allKeys
    const q = query.toLowerCase()
    return allKeys.filter((k) => {
      const keyStr = String(k).toLowerCase()
      if (keyStr.includes(q)) return true
      const val = currentData[k]
      if (val === null || val === undefined) return false
      const valStr = String(val).toLowerCase()
      if (valStr.includes(q)) return true
      return false
    })
  }, [allKeys, currentData, query, isColl])

  if (currentData === undefined) {
    return (
      <div className="jv-explorer jv-explorer--error">
        <p>Invalid path: <code>{path}</code></p>
        <button className="btn" onClick={() => onNavigate('')}>Go to Root</button>
      </div>
    )
  }

  return (
    <div className="jv-explorer">
      <Breadcrumbs path={path} onNavigate={onNavigate} />
      
      {!isColl ? (
        <div className="jv-explorer__primitive">
          <Card
            nodeKey={path.split(/[.\[]/).pop()?.replace(/\]$/, '') || 'Value'}
            value={currentData}
            path={path}
            onNavigate={onNavigate}
            onCopy={onCopy}
            query={query}
          />
        </div>
      ) : (
        <div className="jv-grid">
          {allKeys.length === 0 ? (
            <div className="jv-empty">Empty {type}</div>
          ) : filteredKeys.length === 0 ? (
            <div className="jv-empty">No matches for "{query}"</div>
          ) : (
            filteredKeys.map((k) => (
              <Card
                key={String(k)}
                nodeKey={k}
                value={currentData[k]}
                path={buildPath(path, k, type === 'array')}
                onNavigate={onNavigate}
                onCopy={onCopy}
                query={query}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
