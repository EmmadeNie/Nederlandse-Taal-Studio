import { useI18n } from "../i18n/context";
import { Check } from "../icons";

/** "Opslaan…" / "✓ Opgeslagen" / the error, shown in the dialog. */
export default function SaveStatus({ status, error }) {
  const { t } = useI18n();
  if (status === "error") return <div className="auth-error">{t(error)}</div>;
  if (status === "idle") return null;
  return (
    <div className="save-status dim" role="status">
      {status === "saving" ? (
        t("common.saving")
      ) : (
        <>
          <Check aria-hidden="true" /> {t("common.saved")}
        </>
      )}
    </div>
  );
}
