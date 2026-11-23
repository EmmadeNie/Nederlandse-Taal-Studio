/**
 * "Even oefenen" blocks (<div data-quiz>): the first paragraph is the question,
 * the rest the answer, which goes behind "Laat antwoord zien". "___" in the
 * question becomes a blank to fill in. Runs on HTML that is already sanitized,
 * like the video cards; the elements added here carry no content of their own
 * besides the translated label.
 */
export function withQuizzes(html, { answerLabel }) {
  if (!html || !html.includes("data-quiz")) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.querySelectorAll("div[data-quiz]").forEach((box) => {
    const [question, ...answer] = [...box.children];
    if (question) blanks(doc, question);
    if (!answer.length) return;
    const details = doc.createElement("details");
    details.className = "quiz-answer";
    const summary = doc.createElement("summary");
    summary.textContent = answerLabel;
    details.append(summary, ...answer);
    box.append(details);
  });
  return doc.body.innerHTML;
}

/** "Ik ___ mijn moeder ___." → the underscores become an empty line to fill in. */
function blanks(doc, el) {
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) if (/_{3,}/.test(walker.currentNode.nodeValue)) texts.push(walker.currentNode);
  texts.forEach((node) => {
    const parts = node.nodeValue.split(/_{3,}/);
    const frag = doc.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i > 0) {
        const blank = doc.createElement("span");
        blank.className = "quiz-blank";
        blank.setAttribute("aria-label", "…");
        frag.append(blank);
      }
      if (part) frag.append(doc.createTextNode(part));
    });
    node.replaceWith(frag);
  });
}
