import { useState } from "react";
import { slugLabel } from "./sentenceLists";

/** "Mijn eerste ontmoetingsgesprek" → "mijn-eerste-ontmoetingsgesprek" */
const toSlug = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Free text field for a set name (stored as a slug) with the existing sets
 * as suggestions. Saves on Enter or when you leave the field.
 */
export default function SetInput({ value, onChange, sets, listId, placeholder, label }) {
  const [text, setText] = useState(value ? slugLabel(value) : "");
  const commit = () => {
    const slug = toSlug(text);
    setText(slug ? slugLabel(slug) : "");
    if (slug !== (value || "")) onChange(slug);
  };
  return (
    <>
      <input
        list={listId}
        className="sl-set-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
      />
      <datalist id={listId}>
        {sets.map((x) => (
          <option key={x} value={slugLabel(x)} />
        ))}
      </datalist>
    </>
  );
}
