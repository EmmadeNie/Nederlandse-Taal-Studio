import { useEffect, useState } from "react";
import { LevelBadge, Tag } from "../components/Badges";

import { LEVELS } from "./util";
import { useI18n } from "../i18n/context";
import { ArrowSquareOut, ICONS, X } from "../icons";
import { LabelChips, LabelFilter } from "./Labels";

/** Icon + text in a card's meta row (links, files, note). Renders nothing without text. */
export function MetaItem({ icon: Icon, children }) {
  if (children == null || children === false || children === "") return null;
  return (
    <span className="board-meta-item">
      <Icon aria-hidden="true" /> {children}
    </span>
  );
}

/** Level + labels (+ optional kind, e.g. "Zijpad"). Zijpaden may still carry free-text categories. */
export function Chips({ level, labelIds = [], categories = [], kind }) {
  const { t } = useI18n();
  return (
    <div className="board-card-chips">
      {level ? <LevelBadge level={level} /> : <span className="tag dim">{t("level.noneTag")}</span>}
      <LabelChips ids={labelIds} />
      {categories.map((c) => (
        <Tag key={c}>{c}</Tag>
      ))}
      {kind && (
        <span className="board-kind">
          {kind === t("kind.zijpad") && <ICONS.zijpad aria-hidden="true" />} {kind}
        </span>
      )}
    </div>
  );
}

/** Title + labels, shared by lesson and step cards. */
export function CardBody({ title, level, labelIds, categories, kind, meta }) {
  return (
    <>
      <div className="board-card-title">{title}</div>
      <Chips level={level} labelIds={labelIds} categories={categories} kind={kind} />
      {meta && <div className="board-card-meta">{meta}</div>}
    </>
  );
}

/** Modal dialog in the same style as the feedback dialog. */
export function Dialog({ title, onClose, children, wide }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fb-overlay" onClick={onClose}>
      <div
        className={`fb-dialog lp-dialog ${wide ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fb-dialog-header">
          <h3>{title}</h3>
          <button className="fb-close" onClick={onClose} aria-label={t("common.close")}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Read-only list of links; extras are marked as "only for this student". */
export function LinkList({ links = [], extras = [] }) {
  const { t } = useI18n();
  if (!links.length && !extras.length) {
    return <p className="dim lp-empty">{t("lp.noLinks")}</p>;
  }
  return (
    <ul className="lp-links">
      {links.map((l, i) => (
        <li key={"l" + i}>
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut aria-hidden="true" /> {l.label || l.url}
          </a>
        </li>
      ))}
      {extras.map((l, i) => (
        <li key={"e" + i} className="is-extra">
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut aria-hidden="true" /> {l.label || l.url}
          </a>
          <span className="dim">{t("lp.extraOnly")}</span>
        </li>
      ))}
    </ul>
  );
}

/** Editable list of { label, url } links. */
export function LinksEditor({ value, onChange, addLabel }) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);

  const add = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/.test(u)) {
      setError(t("links.invalid"));
      return;
    }
    onChange([...value, { label: label.trim() || u, url: u }]);
    setLabel("");
    setUrl("");
    setError(null);
  };

  return (
    <div className="lp-links-editor">
      {value.length > 0 && (
        <ul className="lp-links">
          {value.map((l, i) => (
            <li key={i}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut aria-hidden="true" /> {l.label || l.url}
              </a>
              <button
                type="button"
                className="board-icon-btn"
                aria-label={t("links.remove", { name: l.label })}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="lp-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("links.labelPh")}
          aria-label={t("links.labelAria")}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          aria-label={t("links.urlAria")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="fb-btn-secondary" onClick={add}>
          {addLabel || t("links.add")}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

/** Search + level (+ label) filter used above both boards. */
export function BoardFilters({ search, setSearch, level, setLevel, label, setLabel, placeholder }) {
  const { t } = useI18n();
  return (
    <div className="filters lp-filters">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        aria-label={t("common.search")}
      />
      <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t("lp.level")}>
        <option value="">{t("level.all")}</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        <option value="none">{t("level.none")}</option>
      </select>
      {setLabel && <LabelFilter value={label} onChange={setLabel} />}
    </div>
  );
}

