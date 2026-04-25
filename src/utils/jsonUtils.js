// Type detection
export function getValueType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

// Returns true for collection types (arrays/objects)
export function isCollection(value) {
  const t = getValueType(value)
  return t === 'object' || t === 'array'
}

// Stable, sorted key list for objects (preserves insertion order)
export function getKeys(value) {
  const t = getValueType(value)
  if (t === 'array') return value.map((_, i) => i)
  if (t === 'object') return Object.keys(value)
  return []
}

// Build a JSONPath-style string. Bracket notation for indexes and unsafe keys.
export function buildPath(parentPath, key, isIndex) {
  if (isIndex) return `${parentPath}[${key}]`
  // simple identifier check — anything else uses bracket notation
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(key))) {
    return parentPath ? `${parentPath}.${key}` : key
  }
  const escaped = String(key).replace(/"/g, '\\"')
  return `${parentPath}["${escaped}"]`
}

// Pretty byte size
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Walk the tree to gather stats — done iteratively to avoid stack overflow on huge inputs
export function computeStats(root) {
  let keys = 0
  let arrays = 0
  let objects = 0
  let primitives = 0
  let maxDepth = 0

  const stack = [{ value: root, depth: 0 }]
  while (stack.length) {
    const { value, depth } = stack.pop()
    if (depth > maxDepth) maxDepth = depth
    const t = getValueType(value)
    if (t === 'object') {
      objects++
      const k = Object.keys(value)
      keys += k.length
      for (const key of k) stack.push({ value: value[key], depth: depth + 1 })
    } else if (t === 'array') {
      arrays++
      for (const v of value) stack.push({ value: v, depth: depth + 1 })
    } else {
      primitives++
    }
  }
  return { keys, arrays, objects, primitives, maxDepth, total: keys + arrays + objects + primitives }
}

// Search across keys/values. Returns array of matched JSONPath strings.
// Iterative + capped to avoid hangs on huge documents.
export function searchJson(root, query, { caseSensitive = false, limit = 500 } = {}) {
  if (!query) return []
  const needle = caseSensitive ? query : query.toLowerCase()
  const matches = []

  const stack = [{ value: root, path: '' }]
  while (stack.length && matches.length < limit) {
    const { value, path } = stack.pop()
    const t = getValueType(value)

    if (t === 'object') {
      const keys = Object.keys(value)
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i]
        const childPath = buildPath(path, k, false)
        const haystack = caseSensitive ? k : k.toLowerCase()
        if (haystack.includes(needle)) {
          matches.push(childPath)
          if (matches.length >= limit) break
        }
        stack.push({ value: value[k], path: childPath })
      }
    } else if (t === 'array') {
      for (let i = value.length - 1; i >= 0; i--) {
        stack.push({ value: value[i], path: buildPath(path, i, true) })
      }
    } else {
      const str = String(value)
      const haystack = caseSensitive ? str : str.toLowerCase()
      if (haystack.includes(needle)) {
        matches.push(path || '$')
      }
    }
  }
  return matches
}

// Get all parent paths along a path so the tree can auto-expand to a match
export function getAncestorPaths(path) {
  if (!path || path === '$') return ['']
  const ancestors = ['']
  let current = ''
  // tokenize: dots OR [n] OR ["..."]
  const re = /(\.[A-Za-z_$][A-Za-z0-9_$]*)|(\[\d+\])|(\["(?:[^"\\]|\\.)*"\])|^([A-Za-z_$][A-Za-z0-9_$]*)/g
  let m
  while ((m = re.exec(path)) !== null) {
    if (m[0].startsWith('.')) {
      current += m[0]
    } else if (m[0].startsWith('[')) {
      current += m[0]
    } else {
      current += m[0]
    }
    ancestors.push(current)
  }
  ancestors.pop() // last one is the match itself; we want only ancestors
  return ancestors
}

// Sample JSON for the demo / empty state
export const SAMPLE_JSON = {
  app: 'JSON Viewer',
  version: '1.0.0',
  features: ['tree view', 'search', 'collapse all', 'large file support'],
  performance: {
    lazyRendering: true,
    maxTested: '100MB',
    parser: 'native',
  },
  user: {
    name: 'demo',
    roles: ['viewer', 'editor'],
    settings: { theme: 'dark', wrap: false, showTypes: true },
  },
  numbers: [1, 2, 3.14, -42, 1e10],
  flags: { active: true, beta: false, archived: null },
  nested: {
    deeply: {
      nested: {
        value: 'still readable',
      },
    },
  },
}
