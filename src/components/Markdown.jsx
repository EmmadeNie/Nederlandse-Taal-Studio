import { useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { navigate } from "../hooks/useRoute";
import { InternalLinkContext } from "./internalLinks";

/**
 * Markdown renderer for content fields (topic explanations, etc.).
 *
 * Uses react-markdown with GitHub-flavored markdown, so ChatGPT can use
 * bold, lists, headings, tables, links, inline code and more. React-markdown
 * does not render raw HTML by default, which keeps rendering safe.
 * Links to other pages of the app ("/lesprogramma/…") open in place;
 * other links open in a new tab.
 */
export default function Markdown({ children, className }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: Link }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars -- react-markdown passes the AST node
function Link({ href = "", children, node, ...rest }) {
  const handle = useContext(InternalLinkContext);
  if (href.startsWith("/")) {
    return (
      <a
        {...rest}
        href={href}
        className="md-internal-link"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab/window
          e.preventDefault();
          if (handle) handle(href);
          else navigate(href);
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
