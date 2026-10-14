import { useEffect, useLayoutEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { supabase } from "../lib/supabase";
import * as api from "../leerpad/api";
import LanguageToggle from "../i18n/LanguageToggle";
import { STEPS, TOUR_STEP_KEY } from "./tourSteps";
import { ICONS } from "../icons";
import "./tour.css";

/**
 * The first-time tour for a student, floating over the app: their leerpad,
 * the lesprogramma, and putting the whole A0 and A1 curriculum on the leerpad
 * in one go (or choosing lessons themselves). Each step points at a part of
 * the page (data-tour / a selector) and opens the page it belongs to.
 * Finishing or skipping sets profiles.onboarded_at, so it shows once.
 */

const readStep = () => {
  try {
    return Number(sessionStorage.getItem(TOUR_STEP_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeStep = (i) => {
  try {
    if (i == null) sessionStorage.removeItem(TOUR_STEP_KEY);
    else sessionStorage.setItem(TOUR_STEP_KEY, String(i));
  } catch {
    // private mode: the tour starts over on reload
  }
};

/** Where an element is on screen (null when it isn't there or not visible). */
function rectOf(selector) {
  const el = selector && document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const off = r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth;
  if (r.width < 2 || r.height < 2 || off) return null; // e.g. the menu, folded away on a phone
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function Tour({ page, onClose }) {
  const { t } = useI18n();
  const { profile, reloadProfile } = useAuth();
  const [index, setIndex] = useState(readStep);
  const [rect, setRect] = useState(null);
  const [navRect, setNavRect] = useState(null); // the menu item of the page this step is on
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const step = STEPS[Math.min(index, STEPS.length - 1)];

  // Each step lives on its page: go there.
  useEffect(() => {
    if (page !== step.page) navigate(pathFor(step.page));
  }, [page, step.page]);

  // Follow the anchor (it may render late, move with scrolling, or be off screen on a phone).
  useLayoutEffect(() => {
    const el = step.anchor && document.querySelector(step.anchor);
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    const update = () => {
      setRect(rectOf(step.anchor));
      setNavRect(rectOf(`[data-tour="nav-${step.page}"]`));
    };
    update();
    const timer = setInterval(update, 300);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.anchor, step.page, page]);

  const go = (i) => {
    setMessage(null);
    setIndex(i);
    writeStep(i);
  };
  const finish = async () => {
    writeStep(null);
    onClose();
    if (!profile.onboarded_at) {
      await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", profile.id);
      reloadProfile();
    }
  };

  // "Zet A0 en A1 op mijn leerpad": every lesson of those levels, in board order, each in its level lane.
  const addCurriculum = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { lanes, lessons } = await api.loadProgram();
      const laneOrder = new Map(lanes.map((l, i) => [l.id, i]));
      const chosen = lessons
        .filter((l) => step.curriculum.includes(l.level))
        .sort((a, b) => laneOrder.get(a.lane_id) - laneOrder.get(b.lane_id) || a.position - b.position);
      const levelOf = (id) => lessons.find((l) => l.id === id)?.level || null;
      const { added } = await api.planLessons(
        chosen.map((l) => l.id),
        profile.id,
        null,
        { levelOf }
      );
      setMessage({ text: added ? t("tour.added", { n: added }) : t("lp.levelAlready") });
      setTimeout(() => go(STEPS.findIndex((s) => s.id === "practise")), 1200);
    } catch (e) {
      setMessage({ error: true, text: t(e.message) });
    } finally {
      setBusy(false);
    }
  };

  const last = index >= STEPS.length - 1;
  const pad = 6;
  // The card sits below the spotlight, or above it when there is no room; centred without one.
  const cardStyle = (() => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const width = Math.min(360, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const below = rect.top + rect.height + pad + 12;
    if (below + 240 < window.innerHeight) return { top: below, left, width };
    const above = rect.top - pad - 12;
    if (above > 240) return { top: above, left, width, transform: "translateY(-100%)" };
    // A big target (the whole board): the card floats at the bottom, over it.
    return { bottom: 20, left: Math.max(12, (window.innerWidth - width) / 2), width };
  })();

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {navRect && (
        // "Je bent hier": the current page lit up in the menu (drawn over the dimmed sidebar).
        <PageMarker rect={navRect} page={step.page} label={t(`nav.${step.page}`)} here={t("tour.here")} />
      )}
      {rect ? (
        <div
          className="tour-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      ) : (
        <div className="tour-dim" />
      )}
      <div className="tour-card" style={cardStyle}>
        <div className="tour-head">
          <span className="tour-progress">{t("tour.step", { n: index + 1, total: STEPS.length })}</span>
          <span className="tour-dots" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.id} className={i === index ? "is-on" : i < index ? "is-done" : ""} />
            ))}
          </span>
        </div>
        <h3 id="tour-title">{t(`tour.${step.id}.title`)}</h3>
        <p>{t(`tour.${step.id}.text`)}</p>
        {step.demo && <step.demo key={step.id} />}
        {index === 0 && (
          // The tour (and the whole app) also in English: switch right here.
          <div className="tour-lang">
            <span>{t("tour.lang")}</span>
            <LanguageToggle />
          </div>
        )}
        {message && <p className={message.error ? "auth-error" : "note-ok"}>{message.text}</p>}
        <div className="tour-actions">
          {!last && (
            <button type="button" className="fb-link" onClick={finish}>
              {t("tour.skip")}
            </button>
          )}
          <span className="tour-spacer" />
          {index > 0 && (
            <button type="button" className="fb-btn-secondary" onClick={() => go(index - 1)} disabled={busy}>
              {t("tour.back")}
            </button>
          )}
          {step.curriculum ? (
            <>
              <button type="button" className="fb-btn-secondary" onClick={() => go(index + 1)} disabled={busy}>
                {t("tour.levels.self")}
              </button>
              <button type="button" className="fb-btn-primary" onClick={addCurriculum} disabled={busy}>
                {busy ? t("common.loading") : t("tour.levels.add")}
              </button>
            </>
          ) : (
            <button type="button" className="fb-btn-primary" onClick={() => (last ? finish() : go(index + 1))}>
              {last ? t("tour.done") : t(`tour.${step.id}.next`, {}) === `tour.${step.id}.next` ? t("tour.next") : t(`tour.${step.id}.next`)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PageMarker({ rect, page, label, here }) {
  const Icon = ICONS[page];
  return (
    <div className="tour-page" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true">
      {Icon && <Icon weight="fill" size={20} />}
      <span>{label}</span>
      <span className="tour-page-here">{here}</span>
    </div>
  );
}
