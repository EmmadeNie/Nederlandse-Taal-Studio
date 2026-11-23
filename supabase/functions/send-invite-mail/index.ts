// Sends a prepared leerling (no account yet) the invitation e-mail with their
// personal link (/uitnodiging/<code>). Called by a docent from the leerling's
// "Uitnodiging" dialog on Leerpaden, or right after adding the leerling.
//
// From:     Taal Studio <MAIL_FROM>
// Reply-To: the docent's own e-mail (so answers go to the docent)
// Afterwards profiles.invite_sent_at is set, so the docent sees when it went out.
//
// Secrets: RESEND_API_KEY, MAIL_FROM (the same as send-plan-mail).
// Locally, MAIL_DRY_RUN=1 returns the e-mail instead of sending it.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { APP_URL, sendMail } from "../_shared/mail.ts";
import { inviteMail, subject } from "./mail.ts";

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
  if (typeof student !== "string") return json({ error: "Geen leerling opgegeven" }, 400);
  const { data: target } = await admin
    .from("profiles")
    .select("email, display_name, role, user_id, invite_code")
    .eq("id", student)
    .maybeSingle();
  if (!target || target.role !== "leerling") return json({ error: "Leerling niet gevonden" }, 404);
  if (target.user_id) return json({ error: "Deze leerling heeft al een account" }, 409);
  if (!target.email) return json({ error: "Deze leerling heeft nog geen e-mailadres" }, 409);
  if (!target.invite_code) return json({ error: "Deze leerling heeft geen uitnodigingslink" }, 409);

  const docentEmail = me.email || auth.user.email || "";
  const link = `${APP_URL}/uitnodiging/${target.invite_code}`;
  const title = subject(me.display_name || "");
  const { html, text } = inviteMail(target.display_name || "", target.email, me.display_name || "", link);

  if (Deno.env.get("MAIL_DRY_RUN") === "1") {
    return json({ dryRun: true, to: target.email, replyTo: docentEmail, subject: title, link, html, text });
  }

  const failed = await sendMail({ to: target.email, replyTo: docentEmail, subject: title, html, text });
  if (failed) return json({ error: failed.error }, failed.status);

  const sentAt = new Date().toISOString();
  await admin.from("profiles").update({ invite_sent_at: sentAt }).eq("id", student);
  return json({ sent: true, to: target.email, sentAt });
});
