// Sends a student the "your trial has ended" e-mail (Dutch and English), in Taal Studio styling.
// Called by a docent from Gebruikers after moving a student from Trial to Gratis.
//
// From:     Taal Studio <MAIL_FROM>   (an address on a domain verified in Resend)
// Reply-To: the docent's own e-mail   (so answers go to the docent)
//
// Secrets (supabase secrets set …):
//   RESEND_API_KEY   API key from resend.com
//   MAIL_FROM        e.g. noreply@mijntaalstudio.nl
// Locally, MAIL_DRY_RUN=1 returns the e-mail instead of sending it.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SUBJECT, mailHtml } from "./mail.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Who is asking: only a docent may send this.
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth?.user) return json({ error: "Niet ingelogd" }, 401);
  const { data: me } = await admin
    .from("profiles")
    .select("role, display_name, email")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (me?.role !== "docent") return json({ error: "Alleen een docent kan deze mail sturen" }, 403);

  const { student } = await req.json().catch(() => ({}));
  const { data: target } = await admin
    .from("profiles")
    .select("email, display_name, plan, role")
    .eq("id", student)
    .maybeSingle();
  if (!target?.email || target.role !== "leerling") return json({ error: "Leerling niet gevonden of zonder e-mailadres" }, 404);
  if (target.plan !== "gratis") return json({ error: "Deze leerling staat niet op Taal Studio Gratis" }, 409);

  const docentEmail = me.email || auth.user.email || "";
  const html = mailHtml(target.display_name || "", me.display_name || "", docentEmail);

  if (Deno.env.get("MAIL_DRY_RUN") === "1") return json({ dryRun: true, to: target.email, replyTo: docentEmail, subject: SUBJECT, html });

  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM");
  if (!key || !from) return json({ error: "Mail versturen is nog niet ingesteld (RESEND_API_KEY / MAIL_FROM)" }, 500);

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Taal Studio <${from}>`,
      to: [target.email],
      reply_to: docentEmail,
      subject: SUBJECT,
      html,
    }),
  });
  if (!sent.ok) return json({ error: `Mail versturen mislukt (${sent.status}): ${await sent.text()}` }, 502);
  return json({ sent: true, to: target.email });
});
