import { supabase } from "../lib/supabase";
import { useAuth } from "./context";
import { useI18n } from "../i18n/context";
import { Dialog } from "../leerpad/shared";
import { navigate } from "../hooks/useRoute";
import { PATHS } from "../routes";

/** Opens Mijn abonnement (the plans side by side). */
const openPlans = () => navigate(PATHS.plans);

/**
 * Subscriptions (set by hand by the docent, see *_plans.sql). Only leerlingen
 * are limited; staff always have everything.
 *   gratis    look around and read the grammar topics; no lessons, no practising
 *   trial     everything, for now (proefperiode)
 *   compleet  everything
 *   onderweg  grammar topics and practising: flashcards, Invullen, Vervoegen (no lessons)
 * The grammar topics are open to every plan: their short version is public anyway
 * (/grammatica/…), and the full one is what a free account adds.
 */
export const PLANS = ["gratis", "trial", "compleet", "onderweg"];

export function usePlan() {
  const { role, profile } = useAuth();
  const plan = role === "leerling" ? profile?.plan || "compleet" : "compleet";
  return {
    plan,
    canOpenLessons: plan === "trial" || plan === "compleet",
    canPractise: plan !== "gratis",
  };
}

/** What a locked click shows: this belongs to Taal Studio Compleet, ask your docent. */
function LockedText() {
  const { t } = useI18n();
  const { plan } = usePlan();
  return (
    <>
      <p>{t(plan === "onderweg" ? "plan.locked.onderweg" : "plan.locked.gratis")}</p>
      <p>{t("plan.contact")}</p>
    </>
  );
}

export function PlanLocked({ onClose }) {
  const { t } = useI18n();
  return (
    <Dialog title={t("plan.locked.title")} onClose={onClose}>
      <LockedText />
      <div className="lp-actions">
        <button
          type="button"
          className="fb-btn-secondary"
          onClick={() => {
            onClose();
            openPlans();
          }}
        >
          {t("plans.see")}
        </button>
        <button type="button" className="fb-btn-primary" onClick={onClose}>
          {t("plan.ok")}
        </button>
      </div>
    </Dialog>
  );
}

/** The same, as a page (an exercise opened by its address). */
export function PlanLockedPage({ onBack }) {
  const { t } = useI18n();
  return (
    <div className="plan-locked-page">
      <h3>{t("plan.locked.title")}</h3>
      <LockedText />
      <div className="lp-actions">
        <button type="button" className="fb-btn-secondary" onClick={onBack}>
          {t("plan.back")}
        </button>
        <button type="button" className="fb-btn-primary" onClick={openPlans}>
          {t("plans.see")}
        </button>
      </div>
    </div>
  );
}

/** Once, after the docent moved the student from Trial to Gratis. */
export function PlanNotice() {
  const { t } = useI18n();
  const { role, profile, reloadProfile } = useAuth();
  if (role !== "leerling" || profile?.plan_notice !== "trial_ended") return null;
  const close = async () => {
    await supabase.rpc("dismiss_plan_notice");
    reloadProfile();
  };
  return (
    <Dialog title={t("plan.trialEnded.title")} onClose={close}>
      <p>{t("plan.trialEnded.text")}</p>
      <p>{t("plan.contact")}</p>
      <div className="lp-actions">
        <button
          type="button"
          className="fb-btn-secondary"
          onClick={() => {
            close();
            openPlans();
          }}
        >
          {t("plans.see")}
        </button>
        <button type="button" className="fb-btn-primary" onClick={close}>
          {t("plan.ok")}
        </button>
      </div>
    </Dialog>
  );
}

/** The student's subscription, under their name in the menu: opens Mijn abonnement. */
export function PlanBadge() {
  const { t } = useI18n();
  const { role } = useAuth();
  const { plan } = usePlan();
  if (role !== "leerling") return null;
  return (
    <button type="button" className={`plan-badge is-${plan}`} onClick={openPlans}>
      {t(`plan.${plan}`)}
    </button>
  );
}
