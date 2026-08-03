import {
  ComponentType,
  ReactNode,
  createElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  atomOneDark,
  github,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Deck } from "../../constants/data/data.ts";
import { PrepareCardMarkdown } from "./CardUtility.ts";
import {
  parseScriptStyleRules,
  renderScriptStyledChildren,
} from "./ScriptStyleUtility.tsx";

type MarkdownProps = Omit<Options, "children" | "remarkPlugins" | "rehypePlugins"> & {
  children: string;
  className?: string;
  deck?: Pick<
    Deck,
    "presentationConfigJson" | "alwaysAppliedTemplateFront" | "alwaysAppliedTemplateBack"
  > | null;
  presentationConfigJson?: string | null;
  side?: "FRONT" | "BACK";
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

const Markdown = ({
  children,
  className,
  deck,
  presentationConfigJson,
  side,
  ...rest
}: MarkdownProps) => {
  const containerClassName = ["app-markdown", className].filter(Boolean).join(" ");
  const isDarkTheme = useIsDarkTheme();
  const codeStyle = useMemo(() => (isDarkTheme ? atomOneDark : github), [isDarkTheme]);
  const scriptStyleRules = useMemo(
    () => parseScriptStyleRules(presentationConfigJson ?? deck?.presentationConfigJson),
    [deck?.presentationConfigJson, presentationConfigJson]
  );
  const alwaysAppliedTemplate =
    side === "FRONT"
      ? deck?.alwaysAppliedTemplateFront
      : side === "BACK"
        ? deck?.alwaysAppliedTemplateBack
        : "";
  const renderedChildren = useMemo(
    () => PrepareCardMarkdown(alwaysAppliedTemplate || "", children),
    [alwaysAppliedTemplate, children]
  );

  const { components, ...markdownRest } = rest;
  type MarkdownComponentProps = {
    children?: ReactNode;
    node?: unknown;
    [key: string]: unknown;
  };

  const styledTextComponent = (tag: string) => {
    return function StyledTextComponent(textProps: MarkdownComponentProps) {
      const { children: textChildren, node: ignoredNode, ...props } = textProps;
      void ignoredNode;
      const styledChildren = renderScriptStyledChildren(
        textChildren,
        scriptStyleRules
      );
      const Override = components?.[tag as keyof typeof components] as
        | ComponentType<MarkdownComponentProps>
        | undefined;

      if (Override) {
        return createElement(Override, { ...textProps, children: styledChildren });
      }

      return createElement(tag, props, styledChildren);
    };
  };
  const scriptStyledComponents = {
    p: styledTextComponent("p"),
    li: styledTextComponent("li"),
    td: styledTextComponent("td"),
    th: styledTextComponent("th"),
    h1: styledTextComponent("h1"),
    h2: styledTextComponent("h2"),
    h3: styledTextComponent("h3"),
    h4: styledTextComponent("h4"),
    h5: styledTextComponent("h5"),
    h6: styledTextComponent("h6"),
  } as NonNullable<Options["components"]>;

  return (
    <div className={containerClassName}>
      <ReactMarkdown
        {...markdownRest}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: "html" }]]}
        components={{
          ...components,
          ...scriptStyledComponents,
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
        {renderedChildren}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
