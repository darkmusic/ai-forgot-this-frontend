import {
  CSSProperties,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
} from "react";

export type ScriptStyleRule = {
  key: string;
  scripts: string[];
  style: CSSProperties;
};

const DEFAULT_SCRIPT_STYLES: Record<string, Record<string, string | number>> = {
  Arab: {
    fontFamily:
      "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif",
    lineHeight: "2",
    direction: "rtl",
  },
  Deva: {
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  Jpan: {
    fontFamily: "'Noto Sans JP', 'Yu Gothic', 'Hiragino Sans', sans-serif",
  },
};

const SCRIPT_ALIASES: Record<string, string[]> = {
  Arab: ["Arabic"],
  Arabic: ["Arabic"],
  Beng: ["Bengali"],
  Bengali: ["Bengali"],
  Cyrl: ["Cyrillic"],
  Cyrillic: ["Cyrillic"],
  Deva: ["Devanagari"],
  Devanagari: ["Devanagari"],
  Ethi: ["Ethiopic"],
  Ethiopic: ["Ethiopic"],
  Grek: ["Greek"],
  Greek: ["Greek"],
  Gujr: ["Gujarati"],
  Gujarati: ["Gujarati"],
  Guru: ["Gurmukhi"],
  Gurmukhi: ["Gurmukhi"],
  Han: ["Han"],
  Hang: ["Hangul"],
  Hangul: ["Hangul"],
  Hebr: ["Hebrew"],
  Hebrew: ["Hebrew"],
  Hira: ["Hiragana"],
  Hiragana: ["Hiragana"],
  Jpan: ["Han", "Hiragana", "Katakana"],
  Kana: ["Katakana"],
  Katakana: ["Katakana"],
  Knda: ["Kannada"],
  Kannada: ["Kannada"],
  Latn: ["Latin"],
  Latin: ["Latin"],
  Mlym: ["Malayalam"],
  Malayalam: ["Malayalam"],
  Orya: ["Oriya"],
  Oriya: ["Oriya"],
  Sinh: ["Sinhala"],
  Sinhala: ["Sinhala"],
  Taml: ["Tamil"],
  Tamil: ["Tamil"],
  Telu: ["Telugu"],
  Telugu: ["Telugu"],
  Thaa: ["Thaana"],
  Thaana: ["Thaana"],
  Thai: ["Thai"],
};

const SAFE_STYLE_KEYS = new Set([
  "direction",
  "fontFamily",
  "fontFeatureSettings",
  "fontSize",
  "fontStyle",
  "fontVariantLigatures",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "textAlign",
]);

const SCRIPT_REGEX_CACHE = new Map<string, RegExp | null>();

const scriptRegex = (script: string) => {
  if (SCRIPT_REGEX_CACHE.has(script)) {
    return SCRIPT_REGEX_CACHE.get(script) ?? null;
  }

  try {
    const regex = new RegExp(`\\p{Script=${script}}`, "u");
    SCRIPT_REGEX_CACHE.set(script, regex);
    return regex;
  } catch {
    SCRIPT_REGEX_CACHE.set(script, null);
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const sanitizeStyle = (value: unknown) => {
  if (!isRecord(value)) return null;

  const style: Record<string, string | number> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!SAFE_STYLE_KEYS.has(key)) continue;
    if (typeof rawValue !== "string" && typeof rawValue !== "number") continue;
    style[key] = rawValue;
  }

  return Object.keys(style).length > 0 ? (style as CSSProperties) : null;
};

export const parseScriptStyleRules = (
  presentationConfigJson?: string | null
): ScriptStyleRule[] => {
  let scriptStyles: Record<string, unknown> = { ...DEFAULT_SCRIPT_STYLES };

  if (presentationConfigJson?.trim()) {
    try {
      const parsed: unknown = JSON.parse(presentationConfigJson);
      if (isRecord(parsed) && isRecord(parsed.scriptStyles)) {
        scriptStyles = {
          ...scriptStyles,
          ...parsed.scriptStyles,
        };
      }
    } catch {
      // Invalid deck config falls back to built-in script defaults.
    }
  }

  return Object.entries(scriptStyles).flatMap(([key, rawStyle]) => {
    const scripts = SCRIPT_ALIASES[key] ?? [];
    const style = sanitizeStyle(rawStyle);
    if (scripts.length === 0 || style === null) return [];
    return [{ key, scripts, style }];
  });
};

const isNeutral = (value: string) => {
  return /^[\s\p{P}\p{N}\p{S}]$/u.test(value);
};

const matchingRuleIndex = (value: string, rules: ScriptStyleRule[]) => {
  for (let i = 0; i < rules.length; i += 1) {
    if (
      rules[i].scripts.some((script) => {
        const regex = scriptRegex(script);
        return regex?.test(value) ?? false;
      })
    ) {
      return i;
    }
  }
  return null;
};

export const splitTextByScriptStyle = (
  text: string,
  rules: ScriptStyleRule[]
): Array<{ text: string; ruleIndex: number | null }> => {
  if (rules.length === 0 || text.length === 0) return [{ text, ruleIndex: null }];

  const chunks: Array<{ text: string; ruleIndex: number | null }> = [];
  let currentText = "";
  let currentRuleIndex: number | null = null;

  const push = () => {
    if (currentText.length === 0) return;
    const previous = chunks[chunks.length - 1];
    if (previous?.ruleIndex === currentRuleIndex) {
      previous.text += currentText;
    } else {
      chunks.push({ text: currentText, ruleIndex: currentRuleIndex });
    }
    currentText = "";
  };

  for (const char of Array.from(text)) {
    const nextRuleIndex = matchingRuleIndex(char, rules);
    if (nextRuleIndex !== null) {
      if (currentRuleIndex !== nextRuleIndex) {
        push();
        currentRuleIndex = nextRuleIndex;
      }
      currentText += char;
      continue;
    }

    if (isNeutral(char) && currentRuleIndex !== null) {
      currentText += char;
      continue;
    }

    if (currentRuleIndex !== null) {
      push();
      currentRuleIndex = null;
    }
    currentText += char;
  }

  push();
  return chunks;
};

const shouldSkipElement = (element: ReactElement) => {
  if (typeof element.type === "string") {
    if (["code", "pre", "script", "style"].includes(element.type)) return true;
  }

  const className = (element.props as { className?: unknown }).className;
  return typeof className === "string" && /\bkatex\b/.test(className);
};

export const renderScriptStyledChildren = (
  children: ReactNode,
  rules: ScriptStyleRule[]
): ReactNode => {
  if (rules.length === 0) return children;

  const renderNode = (node: ReactNode, keyPrefix: string): ReactNode => {
    if (node == null || typeof node === "boolean") return node;

    if (typeof node === "string" || typeof node === "number") {
      const chunks = splitTextByScriptStyle(String(node), rules);
      if (chunks.length === 1 && chunks[0].ruleIndex === null) return node;
      return chunks.map((chunk, index) => {
        if (chunk.ruleIndex === null) return chunk.text;
        const rule = rules[chunk.ruleIndex];
        return (
          <span
            className="script-style-run"
            data-script-style={rule.key}
            key={`${keyPrefix}-${index}`}
            style={rule.style}
          >
            {chunk.text}
          </span>
        );
      });
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
    }

    if (isValidElement(node)) {
      if (shouldSkipElement(node)) return node;

      const props = node.props as { children?: ReactNode };
      if (!("children" in props)) return node;

      return cloneElement(
        node as ReactElement<{ children?: ReactNode }>,
        undefined,
        renderNode(props.children, `${keyPrefix}-child`)
      );
    }

    return node;
  };

  return renderNode(children, "script-style");
};
