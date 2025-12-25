import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type MarkdownProps = Omit<Options, "children" | "remarkPlugins" | "rehypePlugins"> & {
  children: string;
  className?: string;
};

const Markdown = ({ children, className, ...rest }: MarkdownProps) => {
  const containerClassName = ["app-markdown", className].filter(Boolean).join(" ");

  return (
    <div className={containerClassName}>
      <ReactMarkdown
        {...rest}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: "html" }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
