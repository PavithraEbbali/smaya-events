/**
 * Shared shape + validation for the contact form. Imported by both the client
 * form and the API route so the two can't drift apart. Hand-rolled rather than
 * pulling in a schema library for one form.
 */

export const INQUIRY_TYPES = ['consultation', 'general'] as const
export type InquiryType = (typeof INQUIRY_TYPES)[number]

export type ContactPayload = {
  inquiryType: InquiryType
  name: string
  email: string
  phone: string
  eventType: string
  /** Consultation only. */
  budget?: string
  guests?: string
  eventDate?: string
  requirements?: string
  /** General only. */
  message?: string
  /** Honeypot — must stay empty. */
  company?: string
}

export const EVENT_TYPES = [
  'Wedding / Pre-Wedding',
  'Sangeeth',
  'Corporate Event',
  'Fitness Festival / Retreat',
  'Trekking / Adventure',
  'Social / Community Event',
  'Birthday / Milestone',
  'Other',
] as const

export type FieldErrors = Partial<Record<keyof ContactPayload, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Digits, spaces, dashes, parens and an optional leading +; 7–15 digits.
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Validates an unknown body and returns either the normalised payload or the
 * per-field errors. Runs on the server; the client reuses it for inline
 * validation so both agree on what "valid" means.
 */
export function validateContact(
  body: unknown,
): { ok: true; data: ContactPayload } | { ok: false; errors: FieldErrors } {
  const raw = (body ?? {}) as Record<string, unknown>
  const errors: FieldErrors = {}

  const inquiryType = str(raw.inquiryType) as InquiryType
  if (!INQUIRY_TYPES.includes(inquiryType)) {
    errors.inquiryType = 'Choose an inquiry type.'
  }

  const name = str(raw.name)
  if (name.length < 2) errors.name = 'Please enter your name.'
  if (name.length > 120) errors.name = 'That name is too long.'

  const email = str(raw.email)
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'

  const phone = str(raw.phone)
  if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number.'

  const eventType = str(raw.eventType)
  if (!eventType) errors.eventType = 'Select an event type.'

  const budget = str(raw.budget)
  const guests = str(raw.guests)
  const eventDate = str(raw.eventDate)
  const requirements = str(raw.requirements)
  const message = str(raw.message)

  if (inquiryType === 'general' && message.length < 10) {
    errors.message = 'Tell us a little about your event (10+ characters).'
  }

  for (const [key, value] of Object.entries({
    requirements,
    message,
  })) {
    if (value.length > 5000) {
      errors[key as keyof ContactPayload] = 'That message is too long.'
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      inquiryType,
      name,
      email,
      phone,
      eventType,
      budget: budget || undefined,
      guests: guests || undefined,
      eventDate: eventDate || undefined,
      requirements: requirements || undefined,
      message: message || undefined,
      company: str(raw.company) || undefined,
    },
  }
}
