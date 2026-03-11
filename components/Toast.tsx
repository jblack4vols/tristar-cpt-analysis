'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const Icon = { success: CheckCircle, error: AlertTriangle, info: Info }
  const colors = {
    success: 'bg-green-950/90 border-green-800 text-green-300',
    error:   'bg-red-950/90 border-red-800 text-red-300',
    info:    'bg-zinc-800/90 border-zinc-700 text-zinc-300',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const IconComp = Icon[t.type]
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg
                border shadow-xl text-sm animate-in slide-in-from-right
                backdrop-blur-sm max-w-sm ${colors[t.type]}`}
            >
              <IconComp size={16} className="flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
