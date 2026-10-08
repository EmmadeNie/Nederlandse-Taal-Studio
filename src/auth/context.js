import { createContext, useContext } from "react";

/** Human-readable role names, also used by the user management page. */
export const ROLE_LABELS = {
  docent: "Docent",
  reviewer: "Reviewer",
  leerling: "Leerling",
};

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
