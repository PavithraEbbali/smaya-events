import { NextResponse } from 'next/server'

import { site } from '@/data/site'
import { validateContact, type ContactPayload } from '@/lib/contact-schema'

export const runtime = 'nodejs'

/**
 * Requires RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL — see
 * .env.example. The key must be supplied by the site owner; without it the
 * route still validates and returns 200, logging the inquiry to the server
 * console so local development works without credentials.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.CONTACT_FROM_EMAIL
const TO = process.env.CONTACT_TO_EMAIL

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label: string, value?: string) {
  if (!value) return ''
  return `<tr>
    <td style="padding:6px 14px 6px 0;color:#6b6b6b;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#1C1B1F;font-size:14px;">${escapeHtml(value).replace(/\n/g, '<br />')}</td>
  </tr>`
}

/** The two inquiry types carry different field sets, so the email branches. */
function buildEmail(data: ContactPayload) {
  const isConsultation = data.inquiryType === 'consultation'
  const heading = isConsultation
    ? 'New free-consultation request'
    : 'New general inquiry'

  const rows = [
    row('Name', data.name),
    row('Email', data.email),
    row('Phone', data.phone),
    row('Event type', data.eventType),
    isConsultation ? row('Event date', data.eventDate) : '',
    isConsultation ? row('Budget', data.budget) : '',
    isConsultation ? row('Guests', data.guests) : '',
    isConsultation
      ? row('Requirements', data.requirements)
      : row('Message', data.message),
  ].join('')

  return {
    subject: `${heading}: ${data.name} — ${data.eventType}`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#FAF9F6;padding:28px;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
    <div style="background:#3D1F5C;padding:22px 26px;">
      <p style="margin:0;color:#D4AF37;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;">${escapeHtml(site.name)}</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:19px;font-weight:600;">${escapeHtml(heading)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:26px;margin:22px 26px;">${rows}</table>
  </div>
</div>`,
    text: [
      heading,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Event type: ${data.eventType}`,
      isConsultation && data.eventDate ? `Event date: ${data.eventDate}` : '',
      isConsultation && data.budget ? `Budget: ${data.budget}` : '',
      isConsultation && data.guests ? `Guests: ${data.guests}` : '',
      isConsultation
        ? `Requirements: ${data.requirements ?? '—'}`
        : `Message: ${data.message ?? '—'}`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed request body.' },
      { status: 400 },
    )
  }

  const result = validateContact(body)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'Please check the highlighted fields.', fieldErrors: result.errors },
      { status: 400 },
    )
  }

  // Bots fill every field they can see; humans never see this one.
  if (result.data.company) {
    return NextResponse.json({ ok: true })
  }

  const email = buildEmail(result.data)

  if (!RESEND_API_KEY || !FROM || !TO) {
    console.warn(
      '[contact] RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL not set — inquiry logged instead of sent:\n' +
        email.text,
    )
    return NextResponse.json({ ok: true, delivered: false })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: result.data.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    if (error) {
      console.error('[contact] Resend rejected the message:', error)
      return NextResponse.json(
        { ok: false, error: "We couldn't send your message. Please try again." },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, delivered: true })
  } catch (err) {
    console.error('[contact] Unexpected send failure:', err)
    return NextResponse.json(
      { ok: false, error: "We couldn't send your message. Please try again." },
      { status: 500 },
    )
  }
}
