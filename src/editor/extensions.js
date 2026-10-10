/**
 * The editor's own blocks, stored as plain HTML so they also read well for
 * ChatGPT:
 *   <div data-callout="regel|tip|letop|voorbeeld"> … </div>   a coloured box
 *   <div data-example><p>Nederlandse zin</p><p>English</p></div>   NL + EN
 */
import { Node, mergeAttributes } from "@tiptap/core";
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
  TableKit.configure({ table: { resizable: false } }),
  Callout,
  Example,
];
