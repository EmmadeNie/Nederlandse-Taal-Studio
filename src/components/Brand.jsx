import { useI18n } from "../i18n/context";

/**
 * The logo: a board whose cards stack up like stairs, with the orange card
 * at the top as the goal (your next level). The favicon (public/logo-icon.svg) is the same cards without the tile;
 * the tile and card colours follow the theme (--logo-tile, --logo-card).
 */
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo-mark">
      <rect x="1" y="1" width="38" height="38" rx="9" style={{ fill: "var(--logo-tile)" }} />
      <rect x="6" y="26" width="8" height="8" rx="2" style={{ fill: "var(--logo-card)" }} opacity=".5" />
      <rect x="16" y="26" width="8" height="8" rx="2" style={{ fill: "var(--logo-card)" }} opacity=".75" />
      <rect x="16" y="16" width="8" height="8" rx="2" style={{ fill: "var(--logo-card)" }} opacity=".75" />
      <rect x="26" y="26" width="8" height="8" rx="2" style={{ fill: "var(--logo-card)" }} />
      <rect x="26" y="16" width="8" height="8" rx="2" style={{ fill: "var(--logo-card)" }} />
      <rect x="26" y="6" width="8" height="8" rx="2" fill="#f08c3c" />
    </svg>
  );
}

/** Logo + name + "Nederlands · A0–B2", optionally with the tagline below. */
export default function Brand({ tagline = false, as: Heading = "h1" }) {
  const { t } = useI18n();
  return (
    <div className="brand">
      <div className="brand-row">
        <LogoMark />
        <div className="brand-text">
          <Heading className="brand-name">Taal Studio</Heading>
          <span className="brand-sub">{t("brand.sub")}</span>
        </div>
      </div>
      {tagline && <p className="brand-tagline">{t("brand.tagline")}</p>}
    </div>
  );
}
