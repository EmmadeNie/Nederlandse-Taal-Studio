// The contact form on mijntaalstudio.nl/contact/: mails the message to the docent.
// Public (no login), so: a hidden "website" field that people leave empty (bots
// fill it in), length limits and few links. The docent's address is looked up
// here and never sent to the browser.
//
// From:     Taal Studio <MAIL_FROM>
// To:       the docent's e-mail (profiles, role docent)
// Reply-To: the visitor, so "Reply" answers them
//
// Secrets: RESEND_API_KEY, MAIL_FROM (the same as send-plan-mail).
// Locally, MAIL_DRY_RUN=1 returns the e-mail instead of sending it.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const LEVELS = ["", "A0", "A1", "A2", "B1", "B2", "weet ik niet"];

/** What the visitor sees when something is wrong, in the language of the page. */
const MSG = {
  nl: {
    invalid: "Ongeldig bericht",
    name: "Vul je naam in.",
    email: "Vul een geldig e-mailadres in.",
    message: "Schrijf een bericht (maximaal 3000 tekens).",
    level: "Kies een niveau.",
    links: "Er staan te veel links in je bericht.",
    setup: "Er is nog geen ontvanger ingesteld.",
    mail: "Mail versturen is nog niet ingesteld.",
    failed: "Versturen lukte niet. Probeer het later nog eens.",
  },
  en: {
    invalid: "Invalid message",
    name: "Please fill in your name.",
    email: "Please fill in a valid e-mail address.",
    message: "Please write a message (at most 3000 characters).",
    level: "Please choose a level.",
    links: "Your message contains too many links.",
    setup: "No recipient has been set up yet.",
    mail: "Sending e-mail has not been set up yet.",
    failed: "Sending failed. Please try again later.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: MSG.nl.invalid }, 400);
  const lang = body.lang === "en" ? "en" : "nl";
  const M = MSG[lang];
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const level = String(body.level ?? "").trim();
  const message = String(body.message ?? "").trim();
  const website = String(body.website ?? "").trim();

  // A bot filled in the hidden field: say thanks and drop it.
  if (website) return json({ sent: true });

  if (name.length < 1 || name.length > 100) return json({ error: M.name }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: M.email }, 400);
  if (message.length < 5 || message.length > 3000) return json({ error: M.message }, 400);
  if (!LEVELS.includes(level)) return json({ error: M.level }, 400);
  if ((message.match(/https?:\/\//g) ?? []).length > 2) return json({ error: M.links }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: docent } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "docent")
    .not("email", "is", null)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!docent?.email) return json({ error: M.setup }, 500);

  const subject = `Nieuw bericht via mijntaalstudio.nl: ${name.slice(0, 60)}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#171a21">
<p><strong>${esc(name)}</strong> (${esc(email)}) stuurde een bericht via het contactformulier.</p>
${level ? `<p>Niveau: <strong>${esc(level)}</strong></p>` : ""}
<p>Taal van de pagina: <strong>${lang === "en" ? "Engels" : "Nederlands"}</strong></p>
<div style="white-space:pre-wrap;padding:12px 14px;border-radius:8px;background:#f4f6f9">${esc(message)}</div>
<p style="color:#6b7280;font-size:13px">Met "Antwoorden" schrijf je ${esc(name)} direct terug.</p>
</div>`;

  if (Deno.env.get("MAIL_DRY_RUN") === "1") return json({ dryRun: true, to: docent.email, replyTo: email, subject, html });

  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM");
  if (!key || !from) return json({ error: M.mail }, 500);

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Taal Studio <${from}>`, to: [docent.email], reply_to: email, subject, html }),
  });
  if (!sent.ok) {
    console.error("resend", sent.status, await sent.text());
    return json({ error: M.failed }, 502);
  }
  return json({ sent: true });
});
