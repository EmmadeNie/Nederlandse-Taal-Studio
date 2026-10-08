import { useState } from "react";
import { buildDeepLink } from "../hooks/useUrlParams";

/**
 * Copies a deep link (for use on a Trello card) to the clipboard.
 *
 * Props:
 *   params - object of URL params that recreates this view,
 *            e.g. { page: "topics", topic: "topic.de-het" }
 *   label  - optional button text (defaults to "Kopieer link")
 */
export default function CopyLinkButton({ params, label = "Kopieer link" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const url = buildDeepLink(params);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      className={`copy-link-btn ${copied ? "copied" : ""}`}
      onClick={handleCopy}
      title="Kopieer een link naar dit onderwerp (voor Trello)"
    >
      {copied ? "✓ Gekopieerd" : `🔗 ${label}`}
    </button>
  );
}
