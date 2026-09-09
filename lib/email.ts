import "server-only";

/*
 * Sending mail, and the decision not to.
 *
 * The site has never sent a single message: an enquiry lands in the database
 * and waits for someone to notice it. This module closes that gap for exactly
 * two transactional messages — an acknowledgement to the person who wrote in,
 * and a notification to the operator — and does nothing else.
 *
 * It is deliberately not a marketing sender. The `subscriptions` table stays
 * `pending` and untouched: consenting to occasional updates is a separate
 * permission from being replied to, and nothing here reads that consent.
 *
 * Resend over plain fetch rather than its SDK: one POST, no dependency, and
 * the failure mode stays visible. Missing key means nothing is sent and the
 * caller is told so, rather than a hard failure that loses the enquiry.
 */

const ENDPOINT = "https://api.resend.com/emails";

/* The domain is verified in Resend; any mailbox on it can send. info@ is the
 * address the public site already publishes, so a reply lands where the
 * person expects it to. */
const DEFAULT_FROM = "MaydaLabs <info@maydalabs.com>";
const DEFAULT_NOTIFY = "info@maydalabs.com";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /* Set on the operator notification so replying reaches the enquirer. */
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not_configured" | "rejected" | "unreachable" };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function notifyAddress(): string {
  return process.env.MAYDALABS_NOTIFY_EMAIL || DEFAULT_NOTIFY;
}

function fromAddress(): string {
  return process.env.MAYDALABS_FROM_EMAIL || DEFAULT_FROM;
}

/* Never throws. A failed send must not lose an enquiry that is already
 * safely stored, so every caller gets a result rather than an exception. */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      // A slow provider must not hold the form submission open.
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return { ok: false, reason: "rejected" };
    const body = (await response.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: body?.id ?? null };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
