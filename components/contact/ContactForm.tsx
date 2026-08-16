'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'

import {
  EVENT_TYPES,
  validateContact,
  type FieldErrors,
  type InquiryType,
} from '@/lib/contact-schema'
import { EASE_OUT } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { MagneticButton } from '@/components/ui/MagneticButton'

/*
 * LIGHT FIELDS ON THE CREAM CANVAS.
 *
 * `[color-scheme:dark]` is deliberately GONE. It was the only handle on the
 * native date picker and the select's option list, which the OS draws and no
 * class on the <input> can reach — but it forced those popups dark, and a dark
 * popup opening out of a white card is the same mismatch it was added to fix,
 * inverted. Omitting it lets them inherit the page's light scheme.
 *
 * `ring-2` rather than `ring-1`: one pixel of focus ring against a border that
 * is already 1px is hard to see, and focus visibility is the one style a
 * keyboard user cannot do without. The ring is plum, so focus reads as brand
 * rather than as the browser default blue.
 *
 * PLACEHOLDERS ARE neutral-500 — measured at 4.74:1 on white, which clears AA.
 * A placeholder is the label a user reads while deciding what to type, so it
 * is text, not decoration, and neutral-400 (2.85:1) would not do.
 */
/*
 * The border is `neutral-300`, not `black/10`. A white field on a white card
 * is identified by its edge and nothing else, and black/10 measured 1.26:1 —
 * a hairline you have to hunt for. This reads 1.48:1. See the note in ai.wing:
 * that is still under the 3:1 WCAG 1.4.11 would want IF the border were the
 * sole identifier, which is why every field here keeps a permanent visible
 * <label> above it and a 44px target rather than relying on the outline.
 */
/*
 * `text-base` IS NOT A TASTE CHOICE — IT IS THE iOS ZOOM FIX.
 *
 * Mobile Safari auto-zooms the viewport when a focused form control has a
 * computed font-size under 16px. These were `text-sm` (14px), so every tap on
 * every field yanked the page to ~114% and left it there: the layout jumps,
 * the rest of the form goes off-screen, and the user has to pinch back out
 * between fields. It is the single worst mobile interaction on the site and it
 * is invisible on desktop, which is why it survived this long.
 *
 * 16px is the threshold, not a target — `text-base` sits exactly on it. Do not
 * "tidy" this back to text-sm; use `sm:text-sm` if the desktop size matters,
 * because the zoom only applies to the small viewport anyway.
 */
const inputClasses =
  'w-full min-h-11 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm transition-all placeholder:text-neutral-500 focus:border-smaya-plum focus:outline-none focus:ring-2 focus:ring-smaya-plum/30 sm:text-sm'

const labelClasses =
  'mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-700'

/*
 * AN INVALID FIELD HAS TO LOOK INVALID, NOT ONLY READ AS INVALID.
 *
 * Every field already carried `aria-invalid` and a message underneath, so a
 * screen reader was well served and WCAG 3.3.1 was met. A sighted user was
 * not: the border was the same hairline in both states, so someone who
 * submitted eight fields and failed four had no mark to scan FOR — only prose
 * to read. The border is the one part of a text input legible at a glance.
 *
 * Composed through cn() rather than concatenated because `border-red-500` has
 * to BEAT `border-neutral-300` above; twMerge resolves that conflict by source
 * order, whereas plain string concatenation would leave both classes and let
 * the cascade decide arbitrarily.
 *
 * The focus ring flips red too — otherwise focusing a failed field would
 * repaint it plum and read as "resolved" while the error text still stands.
 */
const fieldClasses = (invalid: boolean) =>
  cn(
    inputClasses,
    invalid && 'border-red-500 focus:border-red-600 focus:ring-red-500/30',
  )

function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The merged Contact + Book form. The inquiry-type toggle swaps in the fuller
 * consultation field set (event date, budget, guest count, requirements)
 * versus the shorter general one (message), sharing one success state.
 */
export function ContactForm() {
  const searchParams = useSearchParams()
  const [inquiryType, setInquiryType] = useState<InquiryType>('general')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle',
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // The nav's "Book Event" CTA links to /contact?type=consultation.
  useEffect(() => {
    if (searchParams.get('type') === 'consultation') {
      setInquiryType('consultation')
    }
  }, [searchParams])

  const isConsultation = inquiryType === 'consultation'
  const prefilledEvent = searchParams.get('event')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const payload = {
      ...Object.fromEntries(new FormData(form).entries()),
      inquiryType,
    }

    // Validate with the same rules the API route uses, so the user gets inline
    // feedback before a round-trip.
    const local = validateContact(payload)
    if (!local.ok) {
      setFieldErrors(local.errors)
      setFormError('Please check the highlighted fields.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setFormError(null)
    setFieldErrors({})

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local.data),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result?.ok) {
        setFieldErrors(result?.fieldErrors ?? {})
        setFormError(
          result?.error ?? "We couldn't send your message. Please try again.",
        )
        setStatus('error')
        return
      }

      form.reset()
      setStatus('success')
    } catch {
      setFormError(
        'Network error — please check your connection, or reach us on WhatsApp.',
      )
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ease: EASE_OUT }}
        /* The success state is the one screen a user reaches only after
           succeeding, so it is also the one nobody checks — it gets the same
           white card and plum/gold treatment as the form it replaces. */
        className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-8 text-center shadow-xl sm:p-12"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-smaya-plum/15 bg-smaya-plum/10 text-smaya-plum">
          <CheckCircle size={40} aria-hidden />
        </div>
        <h2 className="mb-4 font-serif text-2xl text-smaya-charcoal sm:text-3xl">
          Request Received
        </h2>
        <p className="mb-8 max-w-sm text-neutral-600">
          {isConsultation
            ? 'Thank you for choosing Smaya Events. Our team will contact you within 24 hours to schedule your free consultation.'
            : "Thank you for reaching out to Smaya Events. We'll be in touch with you shortly to discuss your big day!"}
        </p>
        <button
          type="button"
          data-tap
          onClick={() => setStatus('idle')}
          className="min-h-11 rounded-full border border-smaya-plum/30 px-5 text-xs font-bold uppercase tracking-[0.2em] text-smaya-plum outline-none transition-colors hover:border-smaya-plum hover:bg-smaya-plum hover:text-white focus-visible:ring-2 focus-visible:ring-smaya-plum focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Submit Another Inquiry
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
      className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8 md:p-12"
    >
      {/* ------------------------ Inquiry-type toggle ---------------------- */}
      <div
        role="tablist"
        aria-label="Inquiry type"
        className="mb-8 grid grid-cols-2 gap-1 rounded-full border border-black/[0.07] bg-smaya-ivory p-1"
      >
        {(
          [
            ['consultation', 'Free Consultation'],
            ['general', 'General Inquiry'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            data-tap
            aria-selected={inquiryType === value}
            onClick={() => {
              setInquiryType(value)
              setFieldErrors({})
              setFormError(null)
              setStatus('idle')
            }}
            className={cn(
              'min-h-11 rounded-full px-4 text-[11px] font-black uppercase tracking-[0.15em] outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-smaya-plum focus-visible:ring-inset sm:text-xs',
              /* The selected pill is the brand plum, matching the nav's active
                 page pill — white on plum is 13.34:1. The idle pill is
                 neutral-600 at 7.36:1 on the ivory track, and hovers to plum
                 rather than to the pale brand gold, which would have measured
                 2.2:1 here. */
              inquiryType === value
                ? 'bg-smaya-plum text-white shadow-sm'
                : 'text-neutral-600 hover:text-smaya-plum',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-2 font-serif text-2xl text-smaya-charcoal">
          {isConsultation ? 'Book a Free Consultation' : 'Send Us a Message'}
        </h2>
        <p className="text-sm text-neutral-600">
          {isConsultation
            ? 'Fill out the details below so we can understand your vision.'
            : 'Tell us what you have in mind and we’ll get right back to you.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field id="name" label="Full Name" error={fieldErrors.name}>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className={fieldClasses(Boolean(fieldErrors.name))}
            />
          </Field>

          <Field id="phone" label="Phone" error={fieldErrors.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+91 99999 99999"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              className={fieldClasses(Boolean(fieldErrors.phone))}
            />
          </Field>
        </div>

        <Field id="email" label="Email Address" error={fieldErrors.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={fieldClasses(Boolean(fieldErrors.email))}
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field id="eventType" label="Event Type" error={fieldErrors.eventType}>
            <select
              id="eventType"
              name="eventType"
              required
              defaultValue=""
              aria-invalid={Boolean(fieldErrors.eventType)}
              aria-describedby={
                fieldErrors.eventType ? 'eventType-error' : undefined
              }
              className={cn(
                fieldClasses(Boolean(fieldErrors.eventType)),
                'appearance-none',
              )}
            >
              <option value="" disabled>
                Select event type
              </option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          {isConsultation && (
            <Field id="eventDate" label="Event Date (if known)">
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                className={inputClasses}
              />
            </Field>
          )}
        </div>

        {/*
          Keyed remount rather than AnimatePresence: the swapped field sets are
          form controls, and an exit animation that stalls would leave the wrong
          inputs mounted. Remounting on `inquiryType` guarantees exactly one
          field set exists at any moment; the fade is decoration on top.
        */}
        <motion.div
          key={inquiryType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
          className="flex flex-col gap-6"
        >
          {isConsultation ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field id="budget" label="Estimated Budget (Optional)">
                  <input
                    id="budget"
                    name="budget"
                    type="text"
                    placeholder="e.g. ₹5,00,000"
                    className={inputClasses}
                  />
                </Field>
                <Field id="guests" label="Number of Guests">
                  <input
                    id="guests"
                    name="guests"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 200"
                    className={inputClasses}
                  />
                </Field>
              </div>

              <Field
                id="requirements"
                label="Specific Requirements / Vision"
                error={fieldErrors.requirements}
              >
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  defaultValue={
                    prefilledEvent
                      ? `I'd like to register for ${prefilledEvent}.`
                      : undefined
                  }
                  placeholder="Tell us what you have in mind..."
                  className={cn(inputClasses, 'resize-none')}
                />
              </Field>
            </>
          ) : (
            <Field id="message" label="Message" error={fieldErrors.message}>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                defaultValue={
                  prefilledEvent
                    ? `I'd like to register for ${prefilledEvent}.`
                    : undefined
                }
                placeholder="Tell us about your event vision..."
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={
                  fieldErrors.message ? 'message-error' : undefined
                }
                className={cn(
                  fieldClasses(Boolean(fieldErrors.message)),
                  'resize-none',
                )}
              />
            </Field>
          )}
        </motion.div>

        {/* Honeypot — visually and programmatically hidden from real users. */}
        <div aria-hidden className="hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status === 'error' && formError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
            {formError}
          </motion.p>
        )}

        <MagneticButton className="mt-2 w-full sm:w-auto" strength={22}>
          <button
            type="submit"
            data-tap
            disabled={status === 'sending'}
            /* PURPLE RESTING, GOLD ON HOVER — the same interaction the nav's
               "Book Event" CTA uses, so the primary action looks the same
               wherever it appears. The gold hover takes CHARCOAL text, not
               white: gold is a light colour and white-on-gold measures about
               1.9:1, which is what made the old all-gold button need a black
               label in the first place. */
            className="w-full rounded-xl bg-smaya-plum px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-md outline-none transition-colors hover:bg-smaya-gold hover:text-smaya-charcoal focus-visible:ring-2 focus-visible:ring-smaya-plum focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:w-auto"
          >
            {status === 'sending'
              ? 'Sending…'
              : isConsultation
                ? 'Book Free Consultation'
                : 'Submit Inquiry'}
          </button>
        </MagneticButton>
      </form>
    </motion.div>
  )
}
