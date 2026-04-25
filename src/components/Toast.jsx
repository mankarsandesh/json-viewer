import { useEffect } from 'react'

export default function Toast({ message, onClose, duration = 1800 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, onClose, duration])

  if (!message) return null
  return (
    <div className="jv-toast" role="status" aria-live="polite">
      <span className="jv-toast__dot" />
      {message}
    </div>
  )
}
