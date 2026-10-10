import { useContentVersion } from "../data/useContent";
import { NewItemButton } from "../library/ItemEditing";
import { queryWords } from "../data";
import VerbCard from "./VerbCard";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";
import { useI18n } from "../i18n/context";

const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

export default function VerbBrowser() {
  const { t } = useI18n();
  useContentVersion();
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();
  const search = urlParams.search || "";
  const level = urlParams.level || "";
  const type = urlParams.type || "";
  const setSearch = (v) => setUrlParams({ search: v });
  const setLevel = (v) => setUrlParams({ level: v });
  const setType = (v) => setUrlParams({ type: v });

  const verbs = queryWords({ partOfSpeech: "verb" }).filter((v) => {
    if (search) {
      const q = search.toLowerCase();
      if (!v.nl.toLowerCase().includes(q) && !v.en.toLowerCase().includes(q))
        return false;
    }
    if (level && v.introducedAtLevel !== level) return false;
    if (type === "fully-regular") {
      const r = v.conjugation?.regularity;
      if (!r || r.past !== "regular" || r.participle !== "regular") return false;
    }
    if (type === "has-irregular") {
      const r = v.conjugation?.regularity;
      if (!r || (r.past === "regular" && r.participle === "regular"))
        return false;
    }
    return true;
  });

  return (
    <div>
      <h2>{t("nav.verbs")}</h2>
      <NewItemButton type="word" extra={{ partOfSpeech: "verb", conjugation: {} }} label={t("ie.new.verb")} />
      <div className="filters">
        <input
          type="text"
          placeholder={t("verbs.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("verbs.searchAria")}
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          aria-label={t("filter.level")}
        >
          <option value="">{t("level.all")}</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label={t("verbs.typeAria")}
        >
          <option value="">{t("verbs.allTypes")}</option>
          <option value="fully-regular">{t("dash.fullyRegular")}</option>
          <option value="has-irregular">{t("dash.hasIrregular")}</option>
        </select>
      </div>
      <p className="result-count">{t("verbs.found", { n: verbs.length })}</p>
      <div className="card-grid">
        {verbs.map((v) => (
          <VerbCard key={v.id} verb={v} />
        ))}
      </div>
    </div>
  );
}
