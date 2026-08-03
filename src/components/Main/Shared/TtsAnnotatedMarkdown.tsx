import { Children, ReactNode, useEffect, useMemo, useState } from "react";
import { Card, Deck, TtsPlaybackItem } from "../../../constants/data/data.ts";
import { getJson } from "../../../lib/api.ts";
import Markdown from "../../Shared/Markdown.tsx";
import TtsAudioControl from "./TtsAudioControl.tsx";

type TtsSide = "FRONT" | "BACK";

const FIELD_OR_SECTION_PATTERN = /^\s*(?:[-*]\s*)?([\p{L}\p{N} _.-]+)\s*:\s*(.*?)\s*$/u;

const normalizeSourceName = (value: string) => {
  const parts = value.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (parts.length === 0) return value.trim();
  return parts
    .map((part, index) =>
      index === 0
        ? part.slice(0, 1).toLowerCase() + part.slice(1)
        : part.slice(0, 1).toUpperCase() + part.slice(1)
    )
    .join("");
};

const normalizeSemanticSourceName = (value: string) => {
  const normalized = normalizeSourceName(value);
  if (normalized.length > "example".length && normalized.startsWith("example")) {
    const nested = normalized.slice("example".length);
    return `example.${nested.slice(0, 1).toLowerCase()}${nested.slice(1)}`;
  }
  return normalized;
};

const sourceForLine = (line: string, prefix: string) => {
  const match = FIELD_OR_SECTION_PATTERN.exec(line);
  if (!match) return null;
  const key = normalizeSemanticSourceName(match[1]);
  const value = match[2].trim();
  return {
    source: value && prefix && !key.startsWith("example.") ? `${prefix}${key}` : key,
    value,
  };
};

const sourceAliases = (source: string | null) => {
  if (!source) return new Set<string>();
  const aliases = new Set([source]);
  const addPair = (a: string, b: string) => {
    if (aliases.has(a)) aliases.add(b);
    if (aliases.has(b)) aliases.add(a);
  };
  addPair("hindi", "devanagari");
  addPair("urdu", "urduScript");
  addPair("romanized", "romanization");
  addPair("example.hindi", "example.devanagari");
  addPair("example.urdu", "example.urduScript");
  if (source.startsWith("example.")) {
    const unprefixed = source.slice("example.".length);
    aliases.add(unprefixed);
    sourceAliases(unprefixed).forEach((alias) => aliases.add(alias));
  }
  return aliases;
};

const targetForSource = (source: string | null) => {
  if (!source) return null;
  return source.includes(".") ? source.slice(0, source.indexOf(".")) : "word";
};

const normalizeRenderedText = (value: string) => {
  return value.replace(/\s+/g, " ").trim();
};

const unwrapBulletHeadings = (markdown: string) => {
  return markdown
    .split("\n")
    .map((line) => line.replace(/^(\s*)[-*]\s+(#{1,6}\s+)/, "$1$2"))
    .join("\n");
};

const textFromNode = (node: ReactNode): string => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (typeof node === "object" && "props" in node) {
    return textFromNode((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
};

const TtsAnnotatedMarkdown = (p: { card: Card; deck: Deck; side: TtsSide; children: string }) => {
  const { card, deck, side, children } = p;
  const [items, setItems] = useState<TtsPlaybackItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setItems([]);
    });
    if (!deck?.ttsEnabled || card?.id == null) return;
    getJson<TtsPlaybackItem[]>(`/api/tts/card/${card.id}/items`)
      .then((resolvedItems) => {
        if (!cancelled) setItems(resolvedItems);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [card?.id, deck?.id, deck?.ttsEnabled]);

  const visibleItems = useMemo(
    () => items.filter((item) => (item.displaySide || "BACK") === side),
    [items, side]
  );
  const renderedMarkdown = useMemo(() => unwrapBulletHeadings(children), [children]);
  const annotationsByText = useMemo(() => {
    const annotations = new Map<string, { source: string | null; value: string }>();
    let prefix = "";

    for (const rawLine of children.split("\n")) {
      const line = rawLine.replace(/^\s*[-*]\s*/, "");
      const sectionMatch = FIELD_OR_SECTION_PATTERN.exec(line);
      if (sectionMatch) {
        const sectionKey = normalizeSemanticSourceName(sectionMatch[1]);
        if (sectionKey.includes("example")) {
          prefix = "example.";
        }
      }

      const annotation = sourceForLine(line, prefix);
      if (!annotation || !annotation.value) continue;
      annotations.set(normalizeRenderedText(line), annotation);
    }

    return annotations;
  }, [children]);

  const controlsForText = (text: string) => {
    const annotation = annotationsByText.get(normalizeRenderedText(text));
    if (!annotation) return null;

    const aliases = sourceAliases(annotation.source);
    const target = targetForSource(annotation.source);
    const lineItems = visibleItems.filter(
      (item) =>
        item.textSource &&
        aliases.has(item.textSource) &&
        (!target || item.target === target)
    );
    if (lineItems.length === 0) return null;

    return (
      <TtsAudioControl
        card={card}
        deck={deck}
        side={side}
        compact
        itemsOverride={lineItems}
      />
    );
  };

  return (
    <Markdown
      className="tts-annotated-markdown"
      deck={deck}
      side={side}
      components={{
        li({ children: liChildren, className, node: ignoredNode, ...rest }) {
          void ignoredNode;
          const text = textFromNode(Children.toArray(liChildren));
          const controls = controlsForText(text);
          return (
            <li className={["tts-markdown-row", className].filter(Boolean).join(" ")} {...rest}>
              {liChildren}
              {controls}
            </li>
          );
        },
      }}
    >
      {renderedMarkdown}
    </Markdown>
  );
};

export default TtsAnnotatedMarkdown;
