import { useI18n } from "../i18n/context";
import { LIBRARY_TABS } from "./libraryTabs";
import { ICONS } from "../icons";
import WordBrowser from "./WordBrowser";
import VerbBrowser from "./VerbBrowser";
import SentenceBrowser from "./SentenceBrowser";
import TopicBrowser from "./TopicBrowser";
import ExerciseBrowser from "./ExerciseBrowser";
import SetBrowser from "../library/SetBrowser";

const PANELS = {
  words: WordBrowser,
  verbs: VerbBrowser,
  sentences: SentenceBrowser,
  topics: TopicBrowser,
  exercises: ExerciseBrowser,
  sets: SetBrowser,
};

/**
 * Bibliotheek / Library: all building blocks that lessons refer to, one tab
 * per kind. The browsers themselves are unchanged; their own page heading is
 * hidden here because the tab already names them.
 */
export default function Library({ tab, onTab, counts }) {
  const { t } = useI18n();
  const Panel = PANELS[tab];
  return (
    <div className="library">
      <h2>{t("nav.library")}</h2>
      <p className="lp-intro">{t("library.intro")}</p>
      <div className="library-tabs" role="tablist" aria-label={t("nav.library")}>
        {LIBRARY_TABS.map((item) => {
          const Icon = ICONS[item.id];
          return (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => onTab(item.id)}
          >
            <Icon weight={tab === item.id ? "fill" : "regular"} aria-hidden="true" /> {t(`nav.${item.id}`)}
            {counts[item.id] !== undefined && <span className="badge">{counts[item.id]}</span>}
          </button>
          );
        })}
      </div>
      <div className="library-panel" role="tabpanel">
        <Panel />
      </div>
    </div>
  );
}
