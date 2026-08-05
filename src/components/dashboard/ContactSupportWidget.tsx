'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Headphones, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { APP_SUPPORT_NAME, FREE_TRAINING_URL, SUPPORT_EMAIL } from '@/lib/support'
import { Field } from '@/components/ui/field'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

async function parseJsonResponse(res: Response) {
  const text = await res.text()
  if (!text.trim()) return {}
  try {
    return JSON.parse(text) as { error?: string; useMailto?: boolean; success?: boolean }
  } catch {
    return null
  }
}

function openMailto(email: string, message: string) {
  const subject = `${APP_SUPPORT_NAME} — Support Request`
  const body = `Please reply to: ${email}\n\n${message}`
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function ContactSupportWidget() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [sentViaMailto, setSentViaMailto] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [])

  const finishSuccess = (addr: string, mailto: boolean) => {
    setSubmittedEmail(addr)
    setSentViaMailto(mailto)
    setFormState('success')
  }

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setErrorMessage('')
      const trimmedEmail = email.trim()
      const trimmedMessage = message.trim()
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setErrorMessage('Please enter a valid email address.')
        setFormState('error')
        return
      }
      if (trimmedMessage.length < 10) {
        setErrorMessage('Please add a bit more detail so we can help you.')
        setFormState('error')
        return
      }
      setFormState('submitting')
      try {
        const res = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ email: trimmedEmail, message: trimmedMessage }),
        })
        const data = await parseJsonResponse(res)
        if (data === null || data.useMailto) {
          openMailto(trimmedEmail, trimmedMessage)
          finishSuccess(trimmedEmail, true)
          return
        }
        if (res.status === 401) throw new Error('Your session expired. Please refresh and try again.')
        if (res.ok && data.success) {
          finishSuccess(trimmedEmail, false)
          return
        }
        throw new Error(data.error || 'Something went wrong.')
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
        setFormState('error')
      }
    },
    [email, message],
  )

  if (formState === 'success') {
    return (
      <div className="card-base min-w-0 space-y-5 overflow-hidden p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg-faint)]">
            <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
          </div>
          <h3 className="ds-h3">{sentViaMailto ? 'Check your email app' : 'Message sent'}</h3>
          <p className="mt-3 w-full text-left text-sm leading-relaxed text-text-secondary">
            {sentViaMailto ? (
              <>
                Tap <span className="font-semibold text-text-primary">Send</span> in your email app to
                deliver your message — then we&apos;ll reply to{' '}
                <span className="break-all font-semibold text-text-primary">{submittedEmail}</span>.
                We usually respond within about 2 hours — allow 24–48 hours when volume is high.
              </>
            ) : (
              <>
                We&apos;ll reply to{' '}
                <span className="break-all font-semibold text-text-primary">{submittedEmail}</span>.
                We usually respond within about 2 hours — allow 24–48 hours when volume is high.
              </>
            )}
          </p>
          <p className="mt-3 w-full text-left text-sm leading-relaxed text-text-muted">
            Remember: our reply will go to{' '}
            <span className="break-all font-semibold text-text-primary">{submittedEmail}</span> only — not
            another inbox you may use elsewhere. If you don&apos;t see it within 48 hours, check that
            inbox&apos;s spam or junk folder.
          </p>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            While you wait, watch our{' '}
            <span className="font-semibold text-[var(--gold)]">free training</span> on scaling to $1k–$5k per
            day.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
            Warning: This may be taken down soon
          </p>
          <a
            href={FREE_TRAINING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 block w-full min-h-[44px] text-center"
          >
            Watch The Free Training &gt;&gt;
          </a>
        </div>
        <button type="button" onClick={() => { setFormState('idle'); setMessage('') }} className="btn-secondary w-full min-h-[44px]">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="card-base min-w-0 space-y-5 overflow-hidden p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
          <Headphones className="text-[var(--gold)]" size={22} strokeWidth={1.75} />
        </div>
        <h3 className="ds-h3">Contact Support</h3>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        We usually reply within about 2 hours. Because of high email volume, please allow{' '}
        <span className="font-medium text-text-primary">24–48 hours</span> during busy periods.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          id="support-email"
          label="Your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={formState === 'submitting'}
          placeholder="you@example.com"
        />
        <Field
          id="support-message"
          as="textarea"
          label="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={formState === 'submitting'}
          rows={4}
          placeholder="Tell us what you need help with..."
        />
        {formState === 'error' && errorMessage && (
          <p className="text-sm text-[var(--danger)]">{errorMessage}</p>
        )}
        <p className="ds-well text-xs leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">Please note:</span> We will reply to the
          email address you enter above. If you don&apos;t see our reply within 48 hours, check your spam
          or junk folder before reaching out again.
        </p>
        <button type="submit" disabled={formState === 'submitting'} className="btn-primary w-full min-h-[48px]">
          {formState === 'submitting' ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending...</span>
          ) : (
            'Send message'
          )}
        </button>
      </form>
      <div className="ds-well flex gap-3">
        <Mail className="shrink-0 text-text-muted" size={16} strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="text-xs text-text-muted">If the form doesn&apos;t work, email us:</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="block break-all text-sm font-semibold text-[var(--gold)] hover:underline">{SUPPORT_EMAIL}</a>
        </div>
      </div>
    </div>
  )
}
