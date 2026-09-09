import type { Locale } from "@/lib/i18n";
import type { IntakeInput } from "@/lib/intakeValidation";
import { SITE_URL } from "@/lib/site";

/*
 * The two transactional emails, in the visual language of the brand email kit
 * in `brand/email/`: table layout, inline styles, an Outlook width shim, and a
 * dark-mode block, because email clients are not browsers.
 *
 * Everything a stranger typed is escaped before it reaches the HTML. A name
 * is a field on a public form, so it is untrusted input on its way into a
 * document, exactly like any other.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DARK = "@media (prefers-color-scheme:dark){.canvas{background:#0a0b0f!important}.card{background:#141c26!important;color:#f1f5fc!important}.muted{color:#b4c2d6!important}.panel{background:#1b2742!important;color:#f1f5fc!important}.text-link{color:#9bb1ff!important}}";

function shell({ lang, title, preheader, kicker, heading, body }: {
  lang: string; title: string; preheader: string; kicker: string; heading: string; body: string;
}): string {
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light dark" /><title>${escapeHtml(title)}</title>
<style>${DARK}</style></head>
<body class="canvas" style="margin:0;padding:0;background:#edf1f7;color:#172338;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:28px 14px;">
<!--[if mso]><table role="presentation" width="560"><tr><td><![endif]-->
<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;color:#172338;border:1px solid #cbd5e4;border-collapse:separate;border-radius:12px;overflow:hidden;">
<tr><td bgcolor="#0A0B0F" style="padding:24px;background:#0a0b0f;border-bottom:3px solid #4b6bff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="48"><img src="${SITE_URL}/brand/logo/maydalabs-mark-transparent-512.png" width="48" height="48" alt="" style="display:block;border:0;width:48px;height:48px;" /></td><td style="padding-left:12px;color:#f3f6fc;font-size:20px;font-weight:700;">MaydaLabs</td></tr></table></td></tr>
<tr><td style="padding:28px 24px 12px;"><p class="muted" style="margin:0 0 14px;color:#566780;font-size:12px;letter-spacing:1px;">${escapeHtml(kicker)}</p><h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:0 24px 28px;">${body}</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<p class="muted" style="max-width:510px;margin:18px 0 0;color:#65718a;font-size:12px;line-height:1.6;">MaydaLabs &middot; Software &amp; automation<br /><a class="text-link" href="mailto:info@maydalabs.com" style="color:#314cc2;text-decoration:underline;">info@maydalabs.com</a></p>
</td></tr></table></body></html>`;
}

function paragraph(text: string): string {
  return `<p class="muted" style="margin:0 0 16px;color:#536078;font-size:16px;line-height:1.65;">${escapeHtml(text)}</p>`;
}

/* ------------------------------------------------------ acknowledgement */

const ACK = {
  en: {
    subject: "We have your message — MaydaLabs",
    preheader: "Your message reached a person, not an autoresponder queue.",
    kicker: "YOUR ENQUIRY",
    heading: "Thanks — we have it.",
    lead: "Mehmet reads every enquiry himself and usually replies within two working days.",
    quoted: "What you sent us:",
    next: "If anything has changed in the meantime, just reply to this email. It reaches the same person.",
    signoff: "MaydaLabs, Istanbul",
    noSubscribe: "This is a one-off reply to your message. It does not sign you up to anything.",
  },
  tr: {
    subject: "Mesajınız bize ulaştı — MaydaLabs",
    preheader: "Mesajınız otomatik bir kuyruğa değil, bir kişiye ulaştı.",
    kicker: "TALEBİNİZ",
    heading: "Teşekkürler, aldık.",
    lead: "Mehmet her talebi kendisi okur ve genellikle iki iş günü içinde yanıtlar.",
    quoted: "Bize gönderdikleriniz:",
    next: "Bu arada bir şey değiştiyse bu e-postayı yanıtlamanız yeterli. Aynı kişiye ulaşır.",
    signoff: "MaydaLabs, İstanbul",
    noSubscribe: "Bu, mesajınıza verilen tek seferlik bir yanıttır. Sizi herhangi bir listeye kaydetmez.",
  },
  fr: {
    subject: "Nous avons bien reçu votre message — MaydaLabs",
    preheader: "Votre message est arrivé chez une personne, pas dans une file automatique.",
    kicker: "VOTRE DEMANDE",
    heading: "Merci, c’est bien arrivé.",
    lead: "Mehmet lit lui-même chaque demande et répond en général sous deux jours ouvrés.",
    quoted: "Ce que vous nous avez envoyé :",
    next: "Si quelque chose a changé entre-temps, répondez simplement à cet e-mail. Il arrive chez la même personne.",
    signoff: "MaydaLabs, Istanbul",
    noSubscribe: "Ceci est une réponse unique à votre message. Cela ne vous inscrit à rien.",
  },
} as const satisfies Record<Locale, unknown>;

export function acknowledgementEmail(intake: IntakeInput): { subject: string; html: string; text: string } {
  const copy = ACK[intake.locale];
  const said = (intake.message ?? "").trim();

  const quoted = said
    ? `<p class="muted" style="margin:0 0 8px;color:#566780;font-size:13px;">${escapeHtml(copy.quoted)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;"><tr><td class="panel" bgcolor="#EDF2FF" style="padding:16px 18px;background:#edf2ff;color:#1b315a;border:1px solid #b9caff;border-radius:8px;font-size:15px;line-height:1.6;">${escapeHtml(said).replace(/\n/g, "<br />")}</td></tr></table>`
    : "";

  const html = shell({
    lang: intake.locale,
    title: copy.subject,
    preheader: copy.preheader,
    kicker: copy.kicker,
    heading: copy.heading,
    body: `${paragraph(copy.lead)}${quoted}${paragraph(copy.next)}
<p class="muted" style="margin:24px 0 0;color:#65718a;font-size:13px;line-height:1.65;">${escapeHtml(copy.signoff)}<br />${escapeHtml(copy.noSubscribe)}</p>`,
  });

  const text = [copy.heading, "", copy.lead, "", said ? `${copy.quoted}\n${said}` : "", "", copy.next, "", copy.signoff, copy.noSubscribe]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { subject: copy.subject, html, text };
}

/* -------------------------------------------------------- notification */

/* Internal, English only, and deliberately plain: this one exists to get a
 * person to the record, not to look like anything. */
export function notificationEmail(intake: IntakeInput): { subject: string; html: string; text: string } {
  const who = intake.company ? `${intake.name} · ${intake.company}` : intake.name;
  const rows: [string, string][] = [
    ["Name", intake.name],
    ["Email", intake.email],
    ["Company", intake.company ?? "—"],
    ["Stage", intake.companyStage ?? "—"],
    ["Constraint", intake.primaryConstraint ?? "—"],
    ["Outcome wanted", intake.desiredOutcome ?? "—"],
    ["Budget", intake.budgetRange ?? "—"],
    ["Timeline", intake.timeline ?? "—"],
    ["Language", intake.locale],
    ["Came from", intake.source],
    ["Wants updates", intake.consentUpdates ? "yes (still pending, nothing sent)" : "no"],
  ];

  const table = rows
    .map(([label, value]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#566780;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(value)}</td></tr>`)
    .join("");

  const said = (intake.message ?? "").trim();
  const message = said
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0;"><tr><td class="panel" bgcolor="#EDF2FF" style="padding:16px 18px;background:#edf2ff;color:#1b315a;border:1px solid #b9caff;border-radius:8px;font-size:15px;line-height:1.6;">${escapeHtml(said).replace(/\n/g, "<br />")}</td></tr></table>`
    : `<p class="muted" style="margin:18px 0 0;color:#536078;font-size:14px;">No message written.</p>`;

  const html = shell({
    lang: "en",
    title: `New enquiry: ${who}`,
    preheader: said.slice(0, 140) || `New enquiry from ${intake.name}.`,
    kicker: "INTERNAL / NEW ENQUIRY",
    heading: who,
    body: `<table role="presentation" cellspacing="0" cellpadding="0" border="0">${table}</table>${message}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;"><tr><td bgcolor="#3F58DF" style="background:#3f58df;border-radius:6px;mso-padding-alt:14px 22px;"><a href="${SITE_URL}/internal/leads" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.3;">Open the record &rarr;</a></td></tr></table>
<p class="muted" style="margin:20px 0 0;color:#65718a;font-size:13px;line-height:1.6;">Reply to this email to answer them directly. Nothing was sent to them beyond an acknowledgement.</p>`,
  });

  const text = [
    `New enquiry: ${who}`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    said ? `Message:\n${said}` : "No message written.",
    "",
    `Record: ${SITE_URL}/internal/leads`,
  ].join("\n");

  return { subject: `New enquiry: ${who}`, html, text };
}
