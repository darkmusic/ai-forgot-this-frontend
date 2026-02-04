import { useEffect, useMemo, useState } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  atomOneDark,
  github,
} from "react-syntax-highlighter/dist/esm/styles/hljs";

type MarkdownProps = Omit<Options, "children" | "remarkPlugins" | "rehypePlugins"> & {
  children: string;
  className?: string;
};

const readIsDarkTheme = () => {
  if (typeof document === "undefined" || typeof window === "undefined") return false;

  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") return true;
  if (theme === "light") return false;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
};

const useIsDarkTheme = () => {
  const [isDark, setIsDark] = useState(readIsDarkTheme);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(readIsDarkTheme());

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMqlChange = () => update();
    mql?.addEventListener?.("change", onMqlChange);

    const mo = new MutationObserver(update);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    update();
    return () => {
      mql?.removeEventListener?.("change", onMqlChange);
      mo.disconnect();
    };
  }, []);

  return isDark;
};

const Markdown = ({ children, className, ...rest }: MarkdownProps) => {
  const containerClassName = ["app-markdown", className].filter(Boolean).join(" ");
  const isDarkTheme = useIsDarkTheme();
  const codeStyle = useMemo(() => (isDarkTheme ? atomOneDark : github), [isDarkTheme]);

  const { components, ...markdownRest } = rest;

  return (
    <div className={containerClassName}>
      <ReactMarkdown
        {...markdownRest}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: "html" }]]}
        components={{
          ...components,
          code(codeProps) {
            const { className: codeClassName, children: codeChildren, ...props } =
              codeProps as unknown as {
                className?: string;
                children?: unknown;
                inline?: boolean;
              } & Record<string, unknown>;

            const inline = (codeProps as { inline?: boolean }).inline;
            const match = /language-([a-z0-9_-]+)/i.exec(codeClassName || "");
            const language = match?.[1];

            if (inline || !language) {
              return (
                <code className={codeClassName} {...props}>
                  {String(codeChildren ?? "")}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={language}
                style={codeStyle}
                PreTag="pre"
              >
                {String(codeChildren).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
