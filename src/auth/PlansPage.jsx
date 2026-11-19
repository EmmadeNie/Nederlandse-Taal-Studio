import { useAuth } from "./context";
import { useI18n } from "../i18n/context";
import { usePlan } from "./plan";
import { PLAN_FEATURES, PLAN_OFFERS, PLAN_TEXT } from "../data/plans";
import { Check, X } from "../icons";

/** The public contact form, in the language of the app. */
const CONTACT = { nl: "/nederlandse-les/#contact", en: "/en/dutch-lessons/#contact" };

/**
 * Mijn abonnement: the plans side by side, the student's own one marked
 * (a trial marks Compleet, which it tries out). Switching goes through the
 * docent for now; there are no payments in the app yet.
 */
export default function PlansPage() {
  const { t, lang } = useI18n();
  const { role } = useAuth();
  const { plan } = usePlan();
  const P = PLAN_TEXT[lang] ?? PLAN_TEXT.nl;
  const student = role === "leerling";
  const current = plan === "trial" ? "compleet" : plan;

  return (
    <div className="plans-page">
      <h2>{P.title}</h2>
      <p className="dim">{P.intro}</p>
      {student && (
        <p className="plans-now">
          {t("plans.now", { plan: t(`plan.${plan}`) })}
          {plan === "trial" && ` ${t("plans.trialNote")}`}
        </p>
      )}

      <div className="plans-grid">
        {PLAN_OFFERS.map((offer) => {
          const mine = student && offer.id === current;
          return (
            <section
              key={offer.id}
              className={`plan-card${offer.featured ? " is-featured" : ""}${mine ? " is-mine" : ""}`}
              aria-current={mine ? "true" : undefined}
            >
              {mine && <span className="plan-card-chip">{t(plan === "trial" ? "plans.trying" : "plans.yours")}</span>}
              <h3>
                <span className="dim">Taal Studio</span> {P.name[offer.id]}
              </h3>
              <p className="plan-card-tagline">{P.tagline[offer.id]}</p>
              <p className="plan-card-price">
                <strong>{P.price(offer.price)}</strong> <span className="dim">{P.perMonth}</span>
              </p>
              {offer.freeWithLessons && (
                <p className="plan-card-deal">
                  {P.freeWith(offer.freeWithLessons)}
                  <span className="dim"> · {P.viaDocent}</span>
                </p>
              )}
              <ul className="plan-card-features">
                {PLAN_FEATURES.map((f) => {
                  const has = offer.features.includes(f);
                  return (
                    <li key={f} className={has ? "" : "is-off"}>
                      {has ? <Check aria-label={t("plans.included")} /> : <X aria-label={t("plans.notIncluded")} />}
                      {P.feature[f]}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="plans-switch">
        <p>{t("plans.switch")}</p>
        <a className="fb-btn-secondary" href={CONTACT[lang] ?? CONTACT.nl}>
          {t("plans.contact")}
        </a>
      </div>
    </div>
  );
}
