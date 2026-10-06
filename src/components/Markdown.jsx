import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown renderer for content fields (topic explanations, etc.).
 *
 * Uses react-markdown with GitHub-flavored markdown, so ChatGPT can use
 * bold, lists, headings, tables, links, inline code and more. React-markdown
 * does not render raw HTML by default, which keeps rendering safe.
 */
export default function Markdown({ children, className }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
