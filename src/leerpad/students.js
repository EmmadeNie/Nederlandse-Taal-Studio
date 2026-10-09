/**
 * Preparing leerlingen before they have an account, and linking accounts to
 * them. The rules live in the database: *_profiles_without_account.sql.
 */
import { supabase } from "../lib/supabase";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

/** Docent: a new leerling with a name and (optionally) an email address. */
export const createStudent = (name, email) =>
  supabase.rpc("create_student", { student_name: name, student_email: email || null }).then(check);

/** Docent: change name/email of a leerling who hasn't logged in yet. */
export const updatePendingStudent = (id, name, email) =>
  supabase
    .rpc("update_pending_student", { student: id, student_name: name, student_email: email || null })
    .then(check);

/** Docent: remove a prepared leerling (and their leerpad) who never logged in. */
export const deletePendingStudent = (id) =>
  supabase.rpc("delete_pending_student", { student: id }).then(check);

/** Docent: the leerling made an account with another email; fold it into the prepared profile. */
export const linkAccountToStudent = (preparedId, accountProfileId) =>
  supabase
    .rpc("link_account_to_student", { prepared: preparedId, account_profile: accountProfileId })
    .then(check);

/** Leerling: after logging in via /uitnodiging/<code>. */
export const claimInvite = (code) => supabase.rpc("claim_invite", { code }).then(check);

export const inviteUrl = (code) => `${window.location.origin}/uitnodiging/${code}`;
