// The "trial ended" e-mail, in Dutch and English (one below the other), in Taal Studio styling.
export const APP_URL = "https://mijntaalstudio.nl";

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const SUBJECT = "Je proefperiode is afgelopen · Your trial has ended";

type Texts = {
  label: string;
  title: string;
  hello: (name: string) => string;
  ended: string;
  more: string;
  contact: (docent: string, email: string) => string;
  bye: string;
};

const TEXTS: Texts[] = [
  {
    label: "Nederlands",
    title: "Je proefperiode van Taal Studio is afgelopen",
    hello: (name) => (name ? `Hoi ${name},` : "Hoi,"),
    ended: "Je proefperiode van Taal Studio is afgelopen. Met Taal Studio Gratis kun je nog steeds rondkijken in de app.",
    more: "Wil je verder met alle lessen en oefeningen? Dan kun je overstappen op Taal Studio Compleet.",
    contact: (docent, email) =>
      `Neem contact op met ${docent || "je docent"} via ${email} voor Taal Studio Compleet, of als je vragen hebt of geïnteresseerd bent in de app.`,
    bye: "Groetjes,",
  },
  {
    label: "English",
    title: "Your Taal Studio trial has ended",
    hello: (name) => (name ? `Hi ${name},` : "Hi,"),
    ended: "Your Taal Studio trial has ended. With Taal Studio Free you can still look around the app.",
    more: "Would you like to continue with all lessons and exercises? You can switch to Taal Studio Compleet.",
    contact: (docent, email) =>
      `Get in touch with ${docent || "your teacher"} at ${email} for Taal Studio Compleet, or if you have questions or are interested in the app.`,
    bye: "Best wishes,",
  },
];

/** "Emma de Vries" → "Emma": the greeting uses the first name. */
export const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

/**
 * The e-mail: logo and name on top, a white card with the Dutch text, then the
 * English, and a blue "Open Taal Studio" button. Answers go to the docent (Reply-To).
 */
export function mailHtml(student: string, docent: string, docentEmail: string) {
  const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#171a21;">${html}</p>`;
  const link = `<a href="mailto:${escape(docentEmail)}" style="color:#2563eb;">${escape(docentEmail)}</a>`;
  const name = escape(firstName(student));
  const section = (tx: Texts, i: number) => `
          ${i > 0 ? '<hr style="border:0;border-top:1px solid #d6dbe3;margin:22px 0;">' : ""}
          <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#5b6372;font-weight:600;margin:0 0 8px;">${tx.label}</div>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#171a21;">${escape(tx.title)}</h1>
          ${p(escape(tx.hello(name)))}
          ${p(escape(tx.ended))}
          ${p(escape(tx.more))}
          ${p(tx.contact(escape(docent), link))}
          ${p(escape(tx.bye) + "<br>" + escape(docent || "Taal Studio"))}`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(SUBJECT)}</title></head>
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
          ${TEXTS.map(section).join("")}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr>
            <td style="background:#2563eb;border-radius:8px;"><a href="${APP_URL}" style="display:inline-block;padding:11px 20px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open Taal Studio</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:14px 4px 0;font-size:12px;color:#5b6372;text-align:center;">
          Taal Studio · <a href="${APP_URL}" style="color:#5b6372;">mijntaalstudio.nl</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
