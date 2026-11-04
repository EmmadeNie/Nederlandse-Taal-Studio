import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";

/**
 * The language a lesson or grammar topic is shown in: the app language to
 * start with (and when it changes), switchable per item with NL | EN.
 */
export function useContentLang() {
  const { lang: appLang } = useI18n();
  const [lang, setLang] = useState(appLang);
  useEffect(() => setLang(appLang), [appLang]);
  return [lang, setLang];
}
