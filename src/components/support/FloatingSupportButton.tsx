'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { ContactSupportWidget } from '@/components/dashboard/ContactSupportWidget'

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Need help? Contact support"
        className="btn-primary fixed bottom-5 right-5 z-40 min-h-[44px] rounded-full px-4 py-3 text-xs shadow-[var(--elevation-2)]"
      >
        <HelpCircle size={16} strokeWidth={2} />
        Need help?
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Contact support">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]">
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close support panel"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] text-text-secondary transition-colors hover:border-[var(--border-strong)] hover:text-text-primary"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="max-h-[min(75dvh,600px)] overflow-y-auto rounded-[var(--radius-lg)]">
              <ContactSupportWidget />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
