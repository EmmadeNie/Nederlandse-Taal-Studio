import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useI18n } from "../i18n/context";
import LessonLinkPicker from "../leerpad/LessonLinkPicker";
import { pathFor } from "../routes";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Columns,
  Eraser,
  Highlighter,
  Info,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Palette,
  Rows,
  Table,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  Trash,
  Translate,
} from "../icons";
import { CALLOUT_KINDS, HIGHLIGHTS, TEXT_COLORS, extensions } from "./extensions";
import { isEmptyHtml, toHtml } from "./richText";
import "./rich.css";

/**
 * WYSIWYG editor for explanations (grammar topics, lessons, zijpaden).
 * value: stored HTML or older Markdown; onChange(html) on every edit
 * ("" when empty); onBlur when you leave it (the dialogs save then).
 * `lessons` (optional) feeds "Les linken"; without it the picker loads them.
 */
export default function RichEditor({ value, onChange, onBlur, lessons, excludeLessonId, label }) {
  const { t, lang } = useI18n();
  // The editor keeps the callbacks it was created with; call the latest ones.
  const latest = useRef({ onChange, onBlur });
  useEffect(() => {
    latest.current = { onChange, onBlur };
  });
  const editor = useEditor({
    extensions,
    content: toHtml(value),
    editorProps: { attributes: { class: "rich", "data-lang": lang, "aria-label": label || t("re.label") } },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      latest.current.onChange(isEmptyHtml(html) ? "" : html);
    },
    onBlur: () => latest.current.onBlur?.(),
  });

  return (
    <div className="rich-editor">
      <Toolbar editor={editor} lessons={lessons} excludeLessonId={excludeLessonId} />
      <EditorContent editor={editor} />
    </div>
  );
}

// Toolbar buttons keep the cursor in the text (no blur, so no save in between).
const keep = (e) => e.preventDefault();

function Btn({ on, label, active, disabled, children }) {
  return (
    <button
      type="button"
      className="re-btn"
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : Boolean(active)}
      disabled={disabled}
      onMouseDown={keep}
      onClick={on}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, lessons, excludeLessonId }) {
  const { t } = useI18n();
  const [menu, setMenu] = useState(null); // "color" | "highlight" | "callout" | null
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
            table: e.isActive("table"),
            callout: e.isActive("callout"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : {},
  });
  if (!editor) return null;

  const chain = () => editor.chain().focus();

  const editLink = () => {
    const current = editor.getAttributes("link").href || "";
    const url = window.prompt(t("re.linkPrompt"), current);
    if (url === null) return;
    if (!url.trim()) chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const linkLesson = (lesson) => {
    const href = pathFor("lesprogramma", lesson.id);
    const { empty } = editor.state.selection;
    if (empty) chain().insertContent({ type: "text", text: lesson.title, marks: [{ type: "link", attrs: { href } }] }).run();
    else chain().setLink({ href }).run();
  };

  return (
    <div className="re-toolbar" role="toolbar" aria-label={t("re.toolbar")}>
      <div className="re-group">
        <Btn label={t("re.h2")} active={state.h2} on={() => chain().toggleHeading({ level: 2 }).run()}>
          <TextHTwo />
        </Btn>
        <Btn label={t("re.h3")} active={state.h3} on={() => chain().toggleHeading({ level: 3 }).run()}>
          <TextHThree />
        </Btn>
      </div>
      <div className="re-group">
        <Btn label={t("re.bold")} active={state.bold} on={() => chain().toggleBold().run()}>
          <TextB />
        </Btn>
        <Btn label={t("re.italic")} active={state.italic} on={() => chain().toggleItalic().run()}>
          <TextItalic />
        </Btn>
        <Btn label={t("re.underline")} active={state.underline} on={() => chain().toggleUnderline().run()}>
          <TextUnderline />
        </Btn>
        <Btn label={t("re.strike")} active={state.strike} on={() => chain().toggleStrike().run()}>
          <TextStrikethrough />
        </Btn>
        <span className="re-menu">
          <Btn label={t("re.color")} active={menu === "color"} on={() => setMenu(menu === "color" ? null : "color")}>
            <Palette />
          </Btn>
          {menu === "color" && (
            <span className="re-pop" role="group" aria-label={t("re.color")}>
              {TEXT_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="re-swatch"
                  style={{ background: c }}
                  aria-label={t(`re.colorName.${i}`)}
                  title={t(`re.colorName.${i}`)}
                  onMouseDown={keep}
                  onClick={() => {
                    chain().setColor(c).run();
                    setMenu(null);
                  }}
                />
              ))}
              <button
                type="button"
                className="re-btn"
                onMouseDown={keep}
                onClick={() => {
                  chain().unsetColor().run();
                  setMenu(null);
                }}
              >
                {t("re.noColor")}
              </button>
            </span>
          )}
        </span>
        <span className="re-menu">
          <Btn
            label={t("re.highlight")}
            active={menu === "highlight"}
            on={() => setMenu(menu === "highlight" ? null : "highlight")}
          >
            <Highlighter />
          </Btn>
          {menu === "highlight" && (
            <span className="re-pop" role="group" aria-label={t("re.highlight")}>
              {HIGHLIGHTS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="re-swatch"
                  style={{ background: c }}
                  aria-label={t(`re.highlightName.${i}`)}
                  title={t(`re.highlightName.${i}`)}
                  onMouseDown={keep}
                  onClick={() => {
                    chain().toggleHighlight({ color: c }).run();
                    setMenu(null);
                  }}
                />
              ))}
              <button
                type="button"
                className="re-btn"
                onMouseDown={keep}
                onClick={() => {
                  chain().unsetHighlight().run();
                  setMenu(null);
                }}
              >
                {t("re.noHighlight")}
              </button>
            </span>
          )}
        </span>
        <Btn label={t("re.clear")} on={() => chain().unsetAllMarks().clearNodes().run()}>
          <Eraser />
        </Btn>
      </div>
      <div className="re-group">
        <Btn label={t("re.bullets")} active={state.bullet} on={() => chain().toggleBulletList().run()}>
          <ListBullets />
        </Btn>
        <Btn label={t("re.numbers")} active={state.ordered} on={() => chain().toggleOrderedList().run()}>
          <ListNumbers />
        </Btn>
      </div>
      <div className="re-group">
        <span className="re-menu">
          <Btn label={t("re.callout")} active={state.callout || menu === "callout"} on={() => setMenu(menu === "callout" ? null : "callout")}>
            <Info />
          </Btn>
          {menu === "callout" && (
            <span className="re-pop re-pop-list" role="group" aria-label={t("re.callout")}>
              {CALLOUT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`re-callout-choice callout-${kind}`}
                  onMouseDown={keep}
                  onClick={() => {
                    chain().setCallout(kind).run();
                    setMenu(null);
                  }}
                >
                  {t(`re.callout.${kind}`)}
                </button>
              ))}
              {state.callout && (
                <button
                  type="button"
                  className="re-btn"
                  onMouseDown={keep}
                  onClick={() => {
                    chain().unsetCallout().run();
                    setMenu(null);
                  }}
                >
                  {t("re.removeCallout")}
                </button>
              )}
            </span>
          )}
        </span>
        <Btn label={t("re.example")} on={() => chain().insertExample(t("re.exampleNl"), t("re.exampleEn")).run()}>
          <Translate />
        </Btn>
        <Btn
          label={t("re.table")}
          active={state.table}
          on={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table />
        </Btn>
      </div>
      {state.table && (
        <div className="re-group" role="group" aria-label={t("re.tableTools")}>
          <Btn label={t("re.addRow")} on={() => chain().addRowAfter().run()}>
            <Rows />+
          </Btn>
          <Btn label={t("re.addCol")} on={() => chain().addColumnAfter().run()}>
            <Columns />+
          </Btn>
          <Btn label={t("re.delRow")} on={() => chain().deleteRow().run()}>
            <Rows />−
          </Btn>
          <Btn label={t("re.delCol")} on={() => chain().deleteColumn().run()}>
            <Columns />−
          </Btn>
          <Btn label={t("re.delTable")} on={() => chain().deleteTable().run()}>
            <Trash />
          </Btn>
        </div>
      )}
      <div className="re-group">
        <Btn label={t("re.link")} active={state.link} on={editLink}>
          <LinkSimple />
        </Btn>
        <LessonLinkPicker lessons={lessons} excludeId={excludeLessonId} onPick={linkLesson} />
      </div>
      <div className="re-group re-history">
        <Btn label={t("re.undo")} disabled={!state.canUndo} on={() => chain().undo().run()}>
          <ArrowCounterClockwise />
        </Btn>
        <Btn label={t("re.redo")} disabled={!state.canRedo} on={() => chain().redo().run()}>
          <ArrowClockwise />
        </Btn>
      </div>
    </div>
  );
}
