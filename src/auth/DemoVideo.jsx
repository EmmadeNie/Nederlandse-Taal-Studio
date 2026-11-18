import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { SpeakerHigh, SpeakerSlash } from "../icons";

const REDUCED = "(prefers-reduced-motion: reduce)";
const PHONE = "(max-width: 900px)";

/** Follows a media query. */
function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * A short demo of the app on the login screen, in the page's language: wide on
 * a computer, a taller cut on a phone. It plays on its own, muted, and loops;
 * with reduced motion it waits for a click. When the video has music
 * (public/demo/info.json), a button turns the sound on.
 * Made by demo/ (recorded screens + Remotion edit).
 */
export default function DemoVideo() {
  const { lang, t } = useI18n();
  const reduced = useMedia(REDUCED);
  const phone = useMedia(PHONE);
  const video = useRef(null);
  const [music, setMusic] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    fetch("/demo/info.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((info) => setMusic(Boolean(info.music)))
      .catch(() => {});
  }, []);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !muted;
    if (muted) v.play().catch(() => {});
    setMuted(!muted);
  };

  const base = `/demo/demo-${lang === "nl" ? "nl" : "en"}${phone ? "-portrait" : ""}`;
  return (
    <figure className={`auth-demo ${phone ? "is-portrait" : ""}`}>
      <video
        ref={video}
        key={base}
        src={`${base}.mp4`}
        poster={`${base}.jpg`}
        autoPlay={!reduced}
        controls={reduced}
        muted={muted}
        loop
        playsInline
        preload={reduced ? "none" : "auto"}
        aria-label={t("login.demoLabel")}
      />
      {music && !reduced && (
        <button type="button" className="auth-demo-sound" onClick={toggleSound} aria-pressed={!muted}>
          {muted ? <SpeakerSlash aria-hidden="true" /> : <SpeakerHigh aria-hidden="true" />}
          <span>{muted ? t("login.soundOn") : t("login.soundOff")}</span>
        </button>
      )}
    </figure>
  );
}
