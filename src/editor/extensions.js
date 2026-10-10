/**
 * The editor's own blocks, stored as plain HTML so they also read well for
 * ChatGPT:
 *   <div data-callout="regel|tip|letop|voorbeeld"> … </div>   a coloured box
 *   <div data-example><p>Nederlandse zin</p><p>English</p></div>   NL + EN
 */
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";

export const CALLOUT_KINDS = ["regel", "tip", "letop", "voorbeeld"];

/** Text colours and highlights that read well on the app's dark background. */
export const TEXT_COLORS = ["#8bbcfb", "#7fd8a8", "#f3c08a", "#f19a9a", "#c4a6f7"];
export const HIGHLIGHTS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8"];

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      kind: {
        default: "tip",
        parseHTML: (el) => (CALLOUT_KINDS.includes(el.getAttribute("data-callout")) ? el.getAttribute("data-callout") : "tip"),
        renderHTML: (attrs) => ({ "data-callout": attrs.kind }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ class: "callout" }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      // Inside a box: change its kind; otherwise put the selection in a new box.
      setCallout:
        (kind) =>
        ({ editor, commands }) =>
          editor.isActive(this.name) ? commands.updateAttributes(this.name, { kind }) : commands.wrapIn(this.name, { kind }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});

export const Example = Node.create({
  name: "example",
  group: "block",
  content: "paragraph+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-example]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-example": "", class: "example" }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      insertExample:
        (nl, en) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              { type: "paragraph", content: [{ type: "text", text: nl }] },
              { type: "paragraph", content: [{ type: "text", text: en }] },
            ],
          }),
    };
  },
});

// Blocks you can't put the cursor right before or after by clicking.
const BOXES = new Set(["table", "callout", "example"]);

/**
 * Click in the space between two blocks where one is a table or box: a new
 * empty line appears there (or the empty line that is already there gets the
 * cursor). Otherwise there is no way to type between a table and what follows.
 */
export const ClickBetweenBlocks = Extension.create({
  name: "clickBetweenBlocks",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              if (event.target !== view.dom || event.button !== 0) return false;
              const { doc, schema } = view.state;
              // The first top-level block below the click.
              let index = doc.childCount;
              let pos = 0;
              let at = doc.content.size;
              for (let i = 0; i < doc.childCount; i++) {
                const dom = view.nodeDOM(pos);
                if (dom?.getBoundingClientRect && event.clientY < dom.getBoundingClientRect().top) {
                  index = i;
                  at = pos;
                  break;
                }
                pos += doc.child(i).nodeSize;
              }
              const before = index > 0 ? doc.child(index - 1) : null;
              const after = index < doc.childCount ? doc.child(index) : null;
              if (!BOXES.has(before?.type.name) && !BOXES.has(after?.type.name)) return false;
              const empty = (n) => n?.type.name === "paragraph" && n.content.size === 0;
              let tr = view.state.tr;
              if (empty(before)) tr = tr.setSelection(TextSelection.create(tr.doc, at - 1));
              else if (empty(after)) tr = tr.setSelection(TextSelection.create(tr.doc, at + 1));
              else {
                tr = tr.insert(at, schema.nodes.paragraph.create());
                tr = tr.setSelection(TextSelection.create(tr.doc, at + 1));
              }
              view.dispatch(tr.scrollIntoView());
              view.focus();
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});

/** Everything the editor knows. */
export const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  // Drag a column border to make it wider or narrower (stored as colwidth / <col> widths).
  TableKit.configure({ table: { resizable: true, cellMinWidth: 40 } }),
  Callout,
  Example,
  ClickBetweenBlocks,
];
