import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startFeedbackSync, stopFeedbackSync } from "../feedback/store";
import { AuthContext } from "./context";

/**
 * Holds the Supabase session and the user's profile (name + role).
 * Starts/stops the feedback sync when someone logs in or out.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role")
      .eq("id", userId)
      .single();
    if (error) console.error("Profiel laden mislukt:", error.message);
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on subscribe, covering page load
    // and the redirect back from a magic link.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        stopFeedbackSync();
        setLoading(false);
        return;
      }
      // Don't await Supabase calls inside this callback (can deadlock the
      // auth client); defer them instead.
      setTimeout(async () => {
        await loadProfile(next.user.id);
        startFeedbackSync(next.user.id);
        setLoading(false);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const updateDisplayName = async (name) => {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", session.user.id);
    if (error) throw error;
    await loadProfile(session.user.id);
  };

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    updateDisplayName,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
