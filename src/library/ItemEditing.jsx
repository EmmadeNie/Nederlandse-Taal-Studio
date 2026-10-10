import { useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { PencilSimple, Plus } from "../icons";
import ItemDialog from "./ItemDialog";
import { newItem } from "./fields";

const useIsDocent = () => useAuth().role === "docent";

/** "Bewerken" on a library card (docent only). */
export function EditItemButton({ item }) {
  const { t } = useI18n();
  const isDocent = useIsDocent();
  const [open, setOpen] = useState(false);
  if (!isDocent) return null;
  return (
    <>
      <button
        type="button"
        className="board-icon-btn ie-edit"
        title={t("ie.edit")}
        aria-label={t("ie.editAria", { id: item.id })}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <PencilSimple />
      </button>
      {open && <ItemDialog item={item} onClose={() => setOpen(false)} />}
    </>
  );
}

/** "+ Nieuw" above a library list (docent only). `extra` presets fields (a verb). */
export function NewItemButton({ type, extra, label }) {
  const { t } = useI18n();
  const isDocent = useIsDocent();
  const [draft, setDraft] = useState(null);
  if (!isDocent) return null;
  return (
    <>
      <button type="button" className="fb-btn-secondary ie-new" onClick={() => setDraft(newItem(type, extra))}>
        <Plus aria-hidden="true" /> {label || t(`ie.new.${type}`)}
      </button>
      {draft && <ItemDialog item={draft} type={type} onClose={() => setDraft(null)} />}
    </>
  );
}
