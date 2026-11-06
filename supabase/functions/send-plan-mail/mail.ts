// The "trial ended" e-mail: texts (nl/en) and the HTML in Taal Studio styling.
export const APP_URL = "https://mijntaalstudio.nl";

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type Texts = {
  subject: string;
  hello: (name: string) => string;
  ended: string;
  free: string;
  more: string;
  contact: (docent: string, email: string) => string;
  button: string;
  open: string;
  bye: string;
};

export const TEXTS: Record<"nl" | "en", Texts> = {
  nl: {
    subject: "Je proefperiode van Taal Studio is afgelopen",
    hello: (name) => (name ? `Hoi ${name},` : "Hoi,"),
    ended: "Je proefperiode van Taal Studio is afgelopen.",
    free: "Met Taal Studio Gratis kun je nog steeds rondkijken in de app.",
    more: "Wil je verder met alle lessen en oefeningen? Dan kun je overstappen op Taal Studio Compleet.",
    contact: (docent, email) =>
      `Neem contact op met ${docent || "je docent"} via <a href="mailto:${email}" style="color:#2563eb;">${email}</a> voor Taal Studio Compleet, of als je vragen hebt of geïnteresseerd bent in de app.`,
    button: "Mail je docent",
    open: "Open Taal Studio",
    bye: "Groetjes,",
  },
  en: {
    subject: "Your Taal Studio trial has ended",
    hello: (name) => (name ? `Hi ${name},` : "Hi,"),
    ended: "Your Taal Studio trial has ended.",
    free: "With Taal Studio Free you can still look around the app.",
    more: "Would you like to continue with all lessons and exercises? You can switch to Taal Studio Compleet.",
    contact: (docent, email) =>
      `Get in touch with ${docent || "your teacher"} at <a href="mailto:${email}" style="color:#2563eb;">${email}</a> for Taal Studio Compleet, or if you have questions or are interested in the app.`,
    button: "E-mail your teacher",
    open: "Open Taal Studio",
    bye: "Best wishes,",
  },
};

/** The e-mail in Taal Studio styling: logo and name on top, a white card, a blue button. */
export function mailHtml(tx: Texts, student: string, docent: string, docentEmail: string) {
  const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#171a21;">${html}</p>`;
  const mailto = `mailto:${docentEmail}?subject=${encodeURIComponent("Taal Studio Compleet")}`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(tx.subject)}</title></head>
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
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#171a21;">${escape(tx.subject)}</h1>
          ${p(escape(tx.hello(student)))}
          ${p(escape(tx.ended) + " " + escape(tx.free))}
          ${p(escape(tx.more))}
          ${p(tx.contact(escape(docent), escape(docentEmail)))}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 22px;"><tr>
            <td style="background:#2563eb;border-radius:8px;"><a href="${mailto}" style="display:inline-block;padding:11px 20px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escape(tx.button)}</a></td>
            <td style="padding-left:14px;"><a href="${APP_URL}" style="font-size:14px;color:#2563eb;text-decoration:none;">${escape(tx.open)} →</a></td>
          </tr></table>
          ${p(escape(tx.bye) + "<br>" + escape(docent || "Taal Studio"))}
        </td></tr>
        <tr><td style="padding:14px 4px 0;font-size:12px;color:#5b6372;text-align:center;">
          Taal Studio · <a href="${APP_URL}" style="color:#5b6372;">mijntaalstudio.nl</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
