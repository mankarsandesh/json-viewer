import { useCallback, useMemo, useState, useEffect } from 'react'
import JsonNode from './JsonNode'
import { isCollection, getKeys, buildPath, getValueType } from '../utils/jsonUtils'

// Iteratively gather all paths in the tree (for expand-all)
function collectAllPaths(root) {
  const paths = new Set([''])
  const stack = [{ value: root, path: '' }]
  while (stack.length) {
    const { value, path } = stack.pop()
    if (!isCollection(value)) continue
    paths.add(path)
    const isArr = getValueType(value) === 'array'
    for (const k of getKeys(value)) {
      const childPath = buildPath(path, k, isArr)
      stack.push({ value: value[k], path: childPath })
    }
  }
  return paths
}

// Collect descendants of a given value
function collectDescendantPaths(value, basePath) {
  const out = new Set()
  if (!isCollection(value)) return out
  const stack = [{ value, path: basePath }]
  while (stack.length) {
    const { value: v, path } = stack.pop()
    if (!isCollection(v)) continue
    out.add(path)
    const isArr = getValueType(v) === 'array'
    for (const k of getKeys(v)) {
      stack.push({ value: v[k], path: buildPath(path, k, isArr) })
    }
  }
  return out
}

export default function JsonViewer({ data, query, matchPaths, onCopy, expandSignal, collapseSignal, expandToPaths }) {
  // Default: root + 1 level expanded
  const initial = useMemo(() => {
    const set = new Set([''])
    if (isCollection(data)) {
      const isArr = getValueType(data) === 'array'
      for (const k of getKeys(data)) {
        const v = data[k]
        if (isCollection(v)) set.add(buildPath('', k, isArr))
      }
    }
    return set
  }, [data])

  const [expandedPaths, setExpandedPaths] = useState(initial)

  // Reset on new data
  useEffect(() => {
    setExpandedPaths(initial)
  }, [initial])

  // Expand-all signal
  useEffect(() => {
    if (expandSignal === 0) return
    setExpandedPaths(collectAllPaths(data))
  }, [expandSignal, data])

  // Collapse-all signal — keep only root expanded
  useEffect(() => {
    if (collapseSignal === 0) return
    setExpandedPaths(new Set(['']))
  }, [collapseSignal, data])

  // Auto-expand ancestors of search matches so they're visible
  useEffect(() => {
    if (!expandToPaths || expandToPaths.size === 0) return
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      for (const p of expandToPaths) next.add(p)
      return next
    })
  }, [expandToPaths])

  const handleToggle = useCallback(
    (path, value, willExpand, recursive) => {
      setExpandedPaths((prev) => {
        const next = new Set(prev)
        if (recursive) {
          const all = collectDescendantPaths(value, path)
          if (willExpand) {
            for (const p of all) next.add(p)
          } else {
            for (const p of all) next.delete(p)
          }
        } else {
          if (willExpand) next.add(path)
          else next.delete(path)
        }
        return next
      })
    },
    []
  )

  const handleCopyPath = useCallback(
    (path) => {
      onCopy(path)
    },
    [onCopy]
  )

  return (
    <div className="jv-tree" role="tree" aria-label="JSON tree">
      <JsonNode
        nodeKey={null}
        value={data}
        path=""
        depth={0}
        isRoot
        isLast
        isIndex={false}
        expandedPaths={expandedPaths}
        onToggle={handleToggle}
        onCopyPath={handleCopyPath}
        query={query}
        matchPaths={matchPaths}
      />
    </div>
  )
}
