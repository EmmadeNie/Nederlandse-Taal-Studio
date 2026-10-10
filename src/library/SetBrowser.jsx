import { useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { sets, setsOfType } from "../data";
import { useContentVersion } from "../data/useContent";
import { createSet } from "../data/contentApi";
import { validateSet } from "../data/validate";
import { LevelBadge } from "../components/Badges";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { Plus } from "../icons";
import SetDialog from "./SetDialog";
import { slugify } from "./fields";

const TYPES = ["word", "sentence", "exercise"];

/**
 * Bibliotheek → Sets: ordered groups of items of one type (the verbs of an
 * exercise, the sentences of a dialogue). A set opens at /bibliotheek/sets/<id>.
 */
export default function SetBrowser() {
  const { t } = useI18n();
  useContentVersion();
  const route = useRoute();
  const isDocent = useAuth().role === "docent";
  const open = sets.find((s) => s.id === route.param);
  const openSet = (id) => navigate(id ? pathFor("sets", id) : pathFor("sets"));

  return (
    <div>
      <h2>{t("nav.sets")}</h2>
      <p className="dim">{t("sets.intro")}</p>
      {isDocent && <NewSetForm onCreated={openSet} />}
      {TYPES.map((type) => {
        const list = setsOfType(type);
        return (
          <section key={type} className="set-group">
            <h3>{t(`sets.type.${type}`)}</h3>
            {list.length === 0 ? (
              <p className="dim lp-empty">{t("sets.noneOfType")}</p>
            ) : (
              <ul className="set-list">
                {list.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => openSet(s.id)}>
                      <span className="set-title">{s.title}</span>
                      <span className="dim">{t(`sets.count.${type}`, { n: s.itemIds.length })}</span>
                      {s.level && <LevelBadge level={s.level} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {route.param && !open && <div className="lp-error">{t("sets.gone")}</div>}
      {open && <SetDialog key={open.id} set={open} canEdit={isDocent} onClose={() => openSet(null)} />}
    </div>
  );
}

function NewSetForm({ onCreated }) {
  const { t } = useI18n();
  const [openForm, setOpenForm] = useState(false);
  const [type, setType] = useState("word");
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const set = { id: slugify(title), type, title: title.trim(), itemIds: [] };
    const found = validateSet(set, { has: () => true, hasSet: (id) => sets.some((s) => s.id === id) }, { isNew: true });
    if (found.length) {
      setError(t(found[0].key, found[0].vars));
      return;
    }
    try {
      await createSet(set);
      setTitle("");
      setOpenForm(false);
      setError(null);
      onCreated(set.id);
    } catch (err) {
      setError(t(err.message));
    }
  };

  if (!openForm) {
    return (
      <button type="button" className="fb-btn-secondary ie-new" onClick={() => setOpenForm(true)}>
        <Plus aria-hidden="true" /> {t("sets.new")}
      </button>
    );
  }
  return (
    <form className="set-new" onSubmit={submit}>
      <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t("sets.typeLabel")}>
        {TYPES.map((x) => (
          <option key={x} value={x}>
            {t(`sets.type.${x}`)}
          </option>
        ))}
      </select>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("sets.titlePh")}
        aria-label={t("sets.title")}
      />
      <button type="submit" className="fb-btn-primary" disabled={!title.trim()}>
        {t("common.add")}
      </button>
      <button type="button" className="fb-btn-secondary" onClick={() => setOpenForm(false)}>
        {t("common.cancelShort")}
      </button>
      {error && <div className="auth-error">{error}</div>}
    </form>
  );
}
