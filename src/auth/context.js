import { createContext, useContext } from "react";

/** The app roles, in the order they are offered on the user management page. */
export const ROLES = ["docent", "reviewer", "leerling"];

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
