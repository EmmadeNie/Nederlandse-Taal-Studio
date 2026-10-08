import { useEffect, useState } from "react";
import { LevelBadge, Tag } from "../components/Badges";

import { LEVELS } from "./util";

/** Level + category labels (+ optional kind, e.g. "Zijpad"). */
export function Chips({ level, categories = [], kind }) {
  return (
    <div className="board-card-chips">
      {level ? <LevelBadge level={level} /> : <span className="tag dim">geen niveau</span>}
      {categories.map((c) => (
        <Tag key={c}>{c}</Tag>
      ))}
      {kind && <span className="board-kind">{kind}</span>}
    </div>
  );
}

/** Title + labels, shared by lesson and step cards. */
export function CardBody({ title, level, categories, kind, meta }) {
  return (
    <>
      <div className="board-card-title">{title}</div>
      <Chips level={level} categories={categories} kind={kind} />
      {meta && <div className="board-card-meta">{meta}</div>}
    </>
  );
}

/** Modal dialog in the same style as the feedback dialog. */
export function Dialog({ title, onClose, children, wide }) {
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
          <button className="fb-close" onClick={onClose} aria-label="Sluiten">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Read-only list of links; extras are marked as "only for this student". */
export function LinkList({ links = [], extras = [] }) {
  if (!links.length && !extras.length) {
    return <p className="dim lp-empty">Nog geen verwijzingen.</p>;
  }
  return (
    <ul className="lp-links">
      {links.map((l, i) => (
        <li key={"l" + i}>
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            ↗ {l.label || l.url}
          </a>
        </li>
      ))}
      {extras.map((l, i) => (
        <li key={"e" + i} className="is-extra">
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            ↗ {l.label || l.url}
          </a>
          <span className="dim">extra, alleen voor deze leerling</span>
        </li>
      ))}
    </ul>
  );
}

/** Editable list of { label, url } links. */
export function LinksEditor({ value, onChange, addLabel = "+ Link" }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);

  const add = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/.test(u)) {
      setError("Vul een link in die begint met https://");
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
                ↗ {l.label || l.url}
              </a>
              <button
                type="button"
                className="board-icon-btn"
                aria-label={`Verwijder ${l.label}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="lp-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Naam, bijv. Google Doc"
          aria-label="Naam van de link"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          aria-label="Adres van de link"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="fb-btn-secondary" onClick={add}>
          {addLabel}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

/** Search + level filter used above both boards. */
export function BoardFilters({ search, setSearch, level, setLevel, placeholder }) {
  return (
    <div className="filters lp-filters">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        aria-label="Zoeken"
      />
      <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Niveau">
        <option value="">Alle niveaus</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        <option value="none">Geen niveau</option>
      </select>
    </div>
  );
}

