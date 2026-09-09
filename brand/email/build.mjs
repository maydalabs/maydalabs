import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const LOGO = "https://maydalabs.com/brand/logo/maydalabs-mark-transparent-512.png";
const mark = `<img src="${LOGO}" width="48" height="48" alt="" style="display:block;border:0;width:48px;height:48px;" />`;
export const CONFIRM_URL = "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email";

export function authEmail(kind = "sign-in", preview = false) {
  if (!["sign-in", "confirmation"].includes(kind)) throw new Error("Unknown auth template");
  const signup = kind === "confirmation";
  const title = signup ? "Confirm your email" : "Sign in to MaydaLabs";
  const intro = signup ? "Enter this code on MaydaLabs to confirm your email and continue." : "Enter this code on the sign-in page to continue to your account.";
  const action = signup ? "Confirm email" : "Sign in";
  const code = preview ? "123456" : "{{ .Token }}";
  const link = preview ? "#preview-only" : CONFIRM_URL;
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light dark" /><title>${title}</title>
<style>@media (prefers-color-scheme:dark){.canvas{background:#0a0b0f!important}.card{background:#141c26!important;color:#f1f5fc!important}.muted{color:#b4c2d6!important}.code{background:#1b2742!important;color:#f1f5fc!important}.text-link{color:#9bb1ff!important}}</style></head>
<body class="canvas" style="margin:0;padding:0;background:#edf1f7;color:#172338;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your MaydaLabs verification code. Never share it with anyone.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:28px 14px;">
<!--[if mso]><table role="presentation" width="560"><tr><td><![endif]-->
<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;color:#172338;border:1px solid #cbd5e4;border-collapse:separate;border-radius:12px;overflow:hidden;">
<tr><td bgcolor="#0A0B0F" style="padding:24px;background:#0a0b0f;border-bottom:3px solid #4b6bff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="48">${mark}</td><td style="padding-left:12px;color:#f3f6fc;font-size:20px;font-weight:700;">MaydaLabs</td></tr></table></td></tr>
<tr><td style="padding:28px 24px 12px;"><p class="muted" style="margin:0 0 14px;color:#566780;font-size:12px;letter-spacing:1px;">YOUR ACCOUNT</p><h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;">${title}</h1><p class="muted" style="margin:0;color:#536078;font-size:16px;line-height:1.6;">${intro}</p></td></tr>
<tr><td style="padding:12px 24px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td class="code" align="center" bgcolor="#EDF2FF" style="padding:20px 4px;background:#edf2ff;color:#1b315a;border:1px solid #b9caff;border-radius:8px;"><span style="font-family:Consolas,'Courier New',monospace;font-size:24px;font-weight:700;letter-spacing:1px;line-height:1.5;">${code}</span></td></tr></table></td></tr>
<tr><td style="padding:0 24px 28px;"><p class="muted" style="margin:0 0 16px;color:#536078;font-size:14px;line-height:1.6;">Prefer a link? Use the button below.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#3F58DF" style="background:#3f58df;border-radius:6px;mso-padding-alt:14px 22px;"><a href="${link}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.3;">${action} &rarr;</a></td></tr></table><p class="muted" style="margin:24px 0 0;color:#536078;font-size:13px;line-height:1.65;">Never share this code or sign-in link. If you didn’t request this email, you can ignore it.</p></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<p class="muted" style="max-width:510px;margin:18px 0 0;color:#65718a;font-size:12px;line-height:1.6;">MaydaLabs &middot; Software &amp; automation<br /><a class="text-link" href="mailto:info@maydalabs.com" style="color:#314cc2;text-decoration:underline;">info@maydalabs.com</a></p>
${preview ? '<p id="preview-only" style="color:#65718a;font-size:12px;">LOCAL PREVIEW — sample code; no sign-in or email is sent.</p>' : ""}
</td></tr></table></body></html>`;
}

export function signature(short = false) {
  if (short) return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#243247;"><tr><td><strong>MaydaLabs</strong> &middot; Software &amp; automation<br /><a href="mailto:info@maydalabs.com" style="color:#3654bd;text-decoration:none;">info@maydalabs.com</a> &middot; <a href="https://maydalabs.com/" style="color:#3654bd;text-decoration:none;">maydalabs.com</a></td></tr></table>`;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#243247;line-height:1.5;"><tr><td valign="top" width="64" style="width:64px;padding-right:14px;"><table role="presentation" cellspacing="0" cellpadding="8" border="0"><tr><td bgcolor="#0A0B0F" style="background:#0a0b0f;border-radius:10px;">${mark}</td></tr></table></td><td valign="top" style="border-left:2px solid #4b6bff;padding-left:14px;"><strong style="font-size:17px;line-height:1.3;">MaydaLabs</strong><br /><span style="font-size:12px;">Software &amp; automation</span><br /><a href="mailto:info@maydalabs.com" style="font-size:12px;color:#3654bd;text-decoration:none;">info@maydalabs.com</a><br /><a href="https://maydalabs.com/" style="font-size:12px;color:#3654bd;text-decoration:none;">maydalabs.com</a></td></tr></table>`;
}

export const SIGNATURE_TEXT = "MaydaLabs\nSoftware & automation\ninfo@maydalabs.com\nhttps://maydalabs.com/\n";

export async function build() {
  const folder = new URL("./", import.meta.url);
  const files = {
    "templates/sign-in.html": authEmail(),
    "templates/confirmation.html": authEmail("confirmation"),
    "preview/sign-in.html": authEmail("sign-in", true),
    "preview/confirmation.html": authEmail("confirmation", true),
    "signature-new.html": signature(),
    "signature-reply.html": signature(true),
    "signature.txt": SIGNATURE_TEXT,
    "preview/signatures.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>MaydaLabs signature preview</title></head><body style="background:#edf1f7;padding:20px;margin:0;font-family:Arial,Helvetica,sans-serif;color:#243247;"><h1 style="font-size:22px;">MaydaLabs · Email signatures</h1><p style="font-size:14px;line-height:1.6;max-width:560px;">Local preview for info@maydalabs.com. Nothing is installed or sent. Both versions also work as plain text.</p><section style="background:white;padding:24px 12px;border:1px solid #cbd5e4;border-radius:8px;max-width:560px;margin-bottom:20px;"><h2 style="font-size:12px;color:#65718a;margin:0 0 24px;">NEW MESSAGES</h2>${signature()}</section><section style="background:white;padding:24px 12px;border:1px solid #cbd5e4;border-radius:8px;max-width:560px;"><h2 style="font-size:12px;color:#65718a;margin:0 0 24px;">REPLIES &amp; FORWARDS</h2>${signature(true)}</section></body></html>`,
  };
  for (const [name, body] of Object.entries(files)) {
    const target = new URL(name, folder);
    await mkdir(new URL(".", target), { recursive: true });
    await writeFile(target, body.trimEnd() + "\n");
  }
  console.log(`Generated ${Object.keys(files).length} local email assets. No auth configuration changed and no email sent.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
