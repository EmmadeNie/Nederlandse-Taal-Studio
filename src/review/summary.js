/** A sentence's analysis in plain lines for the checker: what is marked as what. */
import { getItem } from "../data";

export function summaryLines(sentence, t) {
  const parts = sentence.parts || [];
  const pronouns = sentence.pronouns || [];
  const verbName = (id) => getItem(id)?.nl || id;
  const person = (p) => (p ? t(`parts.person.${p}`) : "");
  const lines = [];
  for (const clause of [undefined, "bijzin"]) {
    const here = parts.filter((p) => (p.clause || undefined) === clause);
    if (!here.length) continue;
    const prefix = clause ? `${t("review.inClause")} · ` : "";
    here
      .filter((p) => p.role === "onderwerp")
      .forEach((p) => lines.push({ key: `${prefix}${t("parts.role.onderwerp")}`, kind: "onderwerp", text: p.text, extra: person(p.person) }));
    const verbs = here.filter((p) => ["persoonsvorm", "werkwoord", "scheidbaar-deel"].includes(p.role));
    verbs.forEach((p) =>
      lines.push({ key: `${prefix}${t(`parts.role.${p.role}`)}`, kind: p.role, text: p.text, extra: verbName(p.wordId) })
    );
  }
  pronouns.forEach((p) =>
    lines.push({
      key: t("review.pronoun"),
      kind: "voornaamwoord",
      text: p.text,
      extra: [t(`parts.pronoun.${p.type}`), person(p.person), p.clause && t("parts.inClause")].filter(Boolean).join(", "),
    })
  );
  (sentence.marks || []).forEach((m) => {
    const word = m.wordId ? getItem(m.wordId)?.nl : null;
    lines.push({
      key: t(`marks.kind.${m.kind}`) === `marks.kind.${m.kind}` ? m.kind : t(`marks.kind.${m.kind}`),
      kind: "woord",
      text: m.text,
      extra: word && word !== m.text ? word : "",
    });
  });
  return lines;
}
