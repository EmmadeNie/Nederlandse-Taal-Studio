import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * A short, silent demo of the app on the login screen, in the page's language.
 * It plays on its own and loops; with reduced motion it waits for a click.
 * Made by demo/ (recorded screens + Remotion edit).
 */
export default function DemoVideo() {
  const { lang, t } = useI18n();
  const [reduced, setReduced] = useState(() => window.matchMedia?.(REDUCED).matches ?? false);

  useEffect(() => {
    const mq = window.matchMedia?.(REDUCED);
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const base = `/demo/demo-${lang === "nl" ? "nl" : "en"}`;
  return (
    <figure className="auth-demo">
      <video
        key={base}
        src={`${base}.mp4`}
        poster={`${base}.jpg`}
        autoPlay={!reduced}
        controls={reduced}
        muted
        loop
        playsInline
        preload={reduced ? "none" : "auto"}
        aria-label={t("login.demoLabel")}
      />
    </figure>
  );
}
