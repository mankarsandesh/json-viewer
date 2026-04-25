import { memo, useState, useEffect, useRef, useMemo } from 'react'
import { getValueType, isCollection, getKeys, buildPath } from '../utils/jsonUtils'

// How many children to render at once before showing a "Load more" pagination.
// Keeps very long arrays from hanging the DOM.
const PAGE_SIZE = 100

function PrimitiveValue({ value, type, query }) {
  if (type === 'string') {
    return (
      <span className="jv-string">
        <Highlight text={`"${value}"`} query={query} />
      </span>
    )
  }
  if (type === 'number') return <span className="jv-number">{String(value)}</span>
  if (type === 'boolean') return <span className="jv-boolean">{String(value)}</span>
  if (type === 'null') return <span className="jv-null">null</span>
  // undefined or unsupported
  return <span className="jv-null">{String(value)}</span>
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="jv-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

function CollectionPreview({ value, type }) {
  if (type === 'array') {
    const len = value.length
    return <span className="jv-preview">[{len === 0 ? ']' : `${len} item${len === 1 ? '' : 's'}]`}</span>
  }
  const keys = Object.keys(value)
  return <span className="jv-preview">{`{${keys.length === 0 ? '}' : `${keys.length} key${keys.length === 1 ? '' : 's'}}`}`}</span>
}

const JsonNode = memo(function JsonNode({
  nodeKey,
  value,
  path,
  depth,
  isRoot = false,
  isLast = true,
  isIndex = false,
  expandedPaths,
  onToggle,
  onCopyPath,
  query,
  matchPaths,
}) {
  const type = getValueType(value)
  const collection = isCollection(value)
  const isExpanded = collection && expandedPaths.has(path)
  const isMatch = matchPaths && matchPaths.has(path)

  const rowRef = useRef(null)
  // Pagination state for large arrays/objects
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // When the matched path is this node, scroll into view
  useEffect(() => {
    if (isMatch && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [isMatch])

  const childKeys = useMemo(() => (collection && isExpanded ? getKeys(value) : []), [collection, isExpanded, value])
  const visibleKeys = childKeys.slice(0, visibleCount)
  const hasMore = childKeys.length > visibleCount

  const openBracket = type === 'array' ? '[' : '{'
  const closeBracket = type === 'array' ? ']' : '}'

  const indent = { paddingLeft: depth === 0 ? 0 : `calc(${depth} * var(--indent))` }

  const handleToggleClick = (e) => {
    if (!collection) return
    if (e.altKey) {
      // Alt+click to toggle recursively
      onToggle(path, value, !isExpanded, true)
    } else {
      onToggle(path, value, !isExpanded, false)
    }
  }

  const renderKeyLabel = () => {
    if (isRoot) return null
    if (isIndex) {
      return <span className="jv-index">{nodeKey}</span>
    }
    return (
      <span className="jv-key">
        <Highlight text={`"${nodeKey}"`} query={query} />
      </span>
    )
  }

  return (
    <div className="jv-node">
      <div
        ref={rowRef}
        className={`jv-row${isMatch ? ' jv-row--match' : ''}${collection ? ' jv-row--collapsible' : ''}`}
        style={indent}
        onClick={collection ? handleToggleClick : undefined}
        title={collection ? 'Click to toggle • Alt+Click to toggle recursively' : undefined}
      >
        <span className={`jv-toggle${collection ? '' : ' jv-toggle--leaf'}`}>
          {collection ? (isExpanded ? '▾' : '▸') : ''}
        </span>

        {renderKeyLabel()}
        {!isRoot && <span className="jv-colon">: </span>}

        {collection ? (
          <>
            <span className="jv-bracket">{openBracket}</span>
            {!isExpanded && <CollectionPreview value={value} type={type} />}
            {isExpanded && (
              <span className="jv-count">
                {type === 'array' ? `${value.length}` : `${Object.keys(value).length}`}
              </span>
            )}
          </>
        ) : (
          <PrimitiveValue value={value} type={type} query={query} />
        )}

        {!isLast && !collection && <span className="jv-comma">,</span>}

        <button
          className="jv-copy"
          onClick={(e) => {
            e.stopPropagation()
            onCopyPath(path || '$')
          }}
          aria-label="Copy path"
          title={`Copy path: ${path || '$'}`}
        >
          ⎘
        </button>
      </div>

      {collection && isExpanded && (
        <>
          {visibleKeys.map((k, i) => {
            const childIsIndex = type === 'array'
            const childPath = buildPath(path, k, childIsIndex)
            const childIsLast = i === childKeys.length - 1
            return (
              <JsonNode
                key={String(k)}
                nodeKey={k}
                value={value[k]}
                path={childPath}
                depth={depth + 1}
                isLast={childIsLast}
                isIndex={childIsIndex}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onCopyPath={onCopyPath}
                query={query}
                matchPaths={matchPaths}
              />
            )
          })}

          {hasMore && (
            <div className="jv-row jv-row--more" style={{ paddingLeft: `calc(${depth + 1} * var(--indent))` }}>
              <button className="jv-more-btn" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load {Math.min(PAGE_SIZE, childKeys.length - visibleCount)} more
              </button>
              <span className="jv-faint">
                {visibleCount} of {childKeys.length}
              </span>
              {childKeys.length - visibleCount > PAGE_SIZE && (
                <button className="jv-more-btn jv-more-btn--ghost" onClick={() => setVisibleCount(childKeys.length)}>
                  Load all
                </button>
              )}
            </div>
          )}

          <div className="jv-row jv-row--close" style={indent}>
            <span className="jv-toggle jv-toggle--leaf"></span>
            <span className="jv-bracket">{closeBracket}</span>
            {!isLast && <span className="jv-comma">,</span>}
          </div>
        </>
      )}
    </div>
  )
})

export default JsonNode
