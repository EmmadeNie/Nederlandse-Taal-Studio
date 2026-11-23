import { supabase } from "../lib/supabase";

/**
 * The login and welcome e-mails link to our own domain
 * (mijntaalstudio.nl/inloggen?token_hash=…&type=email&next=…) instead of to
 * supabase.co: mail filters (Outlook/Hotmail most of all) distrust an e-mail from
 * one domain with a button to another. Here, before the app renders, the token is
 * exchanged for a session and the address bar moves on to where the person was
 * (`next`, only within this site).
 *
 * A link that is used or expired leaves a note for the login page.
 */
export const LINK_FAILED_KEY = "nts-login-link-failed";

const sameSite = (next) => {
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
};

export async function consumeEmailLink() {
  if (!supabase) return;
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get("token_hash");
  if (!tokenHash) return;
  const type = params.get("type") || "email";
  const next = sameSite(params.get("next") || "") || "/";
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    try {
      sessionStorage.setItem(LINK_FAILED_KEY, "1");
    } catch {
      // private mode: the login page just shows without the note
    }
  }
  // Never leave the token in the address bar (or in the history).
  window.history.replaceState(null, "", next);
}
