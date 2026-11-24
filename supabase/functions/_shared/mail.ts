// Shared pieces of the e-mails the app sends (send-plan-mail, send-invite-mail):
// HTML escaping and the Taal Studio layout (logo and name on top, a white card,
// a blue button, a small footer).
export const APP_URL = "https://mijntaalstudio.nl";

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "Emma de Vries" → "Emma": the greeting uses the first name. */
export const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

/** A paragraph in the card; `html` must already be escaped. */
export const p = (html: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#171a21;">${html}</p>`;

export const h1 = (text: string) =>
  `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#171a21;">${escape(text)}</h1>`;

export const hr = '<hr style="border:0;border-top:1px solid #d6dbe3;margin:22px 0;">';

export const mailLink = (email: string) =>
  `<a href="mailto:${escape(email)}" style="color:#2563eb;">${escape(email)}</a>`;

/** The blue button. */
export const cta = (label: string, href: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr>
            <td style="background:#2563eb;border-radius:8px;"><a href="${escape(href)}" style="display:inline-block;padding:11px 20px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escape(label)}</a></td>
          </tr></table>`;

/**
 * The whole e-mail: `card` is the (escaped) content of the white card, the button (if any)
 * goes below it, and `after` (optional, escaped) below the button.
 */
export function layout(title: string, card: string, button: { label: string; href: string } | null, after = "") {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding:0 4px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><img src="${APP_URL}/logo-icon-180.png" width="36" height="36" alt="" style="display:block;border-radius:8px;"></td>
            <td style="vertical-align:middle;padding-left:10px;">
              <div style="font-size:17px;font-weight:700;color:#171a21;">Taal Studio</div>
              <div style="font-size:10px;letter-spacing:1.5px;color:#2563eb;font-weight:600;">NEDERLANDS · A0–B2</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #d6dbe3;border-radius:12px;padding:26px 24px;">
          ${card}
          ${button ? cta(button.label, button.href) : ""}
          ${after}
        </td></tr>
        <tr><td style="padding:14px 4px 0;font-size:12px;color:#5b6372;text-align:center;">
          Taal Studio · <a href="${APP_URL}" style="color:#5b6372;">mijntaalstudio.nl</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Sends through Resend; returns { status, error } when it failed, or null when it was sent. */
export async function sendMail(mail: { to: string; replyTo: string; subject: string; html: string; text?: string }) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM");
  if (!key || !from) return { status: 500, error: "Mail versturen is nog niet ingesteld (RESEND_API_KEY / MAIL_FROM)" };
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Taal Studio <${from}>`,
      to: [mail.to],
      reply_to: mail.replyTo || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  if (!sent.ok) return { status: 502, error: `Mail versturen mislukt (${sent.status}): ${await sent.text()}` };
  return null;
}
