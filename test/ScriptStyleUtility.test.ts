import assert from "node:assert/strict";
import test from "node:test";
import {
  parseScriptStyleRules,
  splitTextByScriptStyle,
} from "../src/components/Shared/ScriptStyleUtility";

const config = JSON.stringify({
  scriptStyles: {
    Arab: {
      fontFamily: "'Noto Nastaliq Urdu', serif",
      lineHeight: "2",
      color: "red",
    },
    Deva: {
      fontFamily: "'Noto Sans Devanagari', sans-serif",
    },
    Jpan: {
      fontFamily: "'Noto Sans JP', sans-serif",
    },
  },
});

test("splits Urdu Arabic-script runs without styling surrounding Latin text", () => {
  const rules = parseScriptStyleRules(null);
  const chunks = splitTextByScriptStyle("Word سلام test", rules);

  assert.deepEqual(
    chunks.map((chunk) => ({ text: chunk.text, styled: chunk.ruleIndex !== null })),
    [
      { text: "Word ", styled: false },
      { text: "سلام ", styled: true },
      { text: "test", styled: false },
    ]
  );
});

test("splits Devanagari runs", () => {
  const rules = parseScriptStyleRules(null);
  const chunks = splitTextByScriptStyle("namaste नमस्ते", rules);

  assert.deepEqual(
    chunks.map((chunk) => ({ text: chunk.text, styled: chunk.ruleIndex !== null })),
    [
      { text: "namaste ", styled: false },
      { text: "नमस्ते", styled: true },
    ]
  );
});

test("treats Japanese as Han, Hiragana, and Katakana", () => {
  const rules = parseScriptStyleRules(null);
  const chunks = splitTextByScriptStyle("日本かなカナ word", rules);

  assert.deepEqual(
    chunks.map((chunk) => ({ text: chunk.text, styled: chunk.ruleIndex !== null })),
    [
      { text: "日本かなカナ ", styled: true },
      { text: "word", styled: false },
    ]
  );
});

test("uses built-in defaults for blank or invalid config", () => {
  const blankRules = parseScriptStyleRules(null);
  const invalidRules = parseScriptStyleRules("{not json");

  assert.equal(blankRules[0].key, "Arab");
  assert.equal(
    blankRules[0].style.fontFamily,
    "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif"
  );
  assert.deepEqual(invalidRules, blankRules);
});

test("deck config overrides defaults and ignores non-whitelisted CSS properties", () => {
  const rules = parseScriptStyleRules(config);
  assert.equal(rules[0].style.fontFamily, "'Noto Nastaliq Urdu', serif");
  assert.equal(rules[0].style.lineHeight, "2");
  assert.equal("color" in rules[0].style, false);
});
