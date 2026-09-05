import assert from "node:assert/strict";
import test from "node:test";
import { applyAiResult, applyMerges, draftContext, undoAiChange, changedRows } from "../src/lib/deckAssist";
import type { BulkCardRow, AiChange } from "../src/lib/deckAssist";
import { readAiEvents } from "../src/lib/aiEvents";

const row = (tempId: string, props: Partial<BulkCardRow> = {}): BulkCardRow => ({
  tempId, cardId: Number(tempId), front: `front ${tempId}`, back: `back ${tempId}`, tagNames: "Biology", isDeleted: false, ...props,
});
const change = (before: BulkCardRow[], after: BulkCardRow[], merges: string[][] = []): AiChange => ({ label: "Test", before, after, merges });

test("context includes unsaved rows, preserves content and normalizes tags; excludes deleted and blank cards", () => {
  const rows = [row("1", { front: "Edited", tagNames: "#Biology, biology, Two   Words" }), row("new", { cardId: null }),
    row("2", { isDeleted: true }), row("3", { front: " ", back: "" })];
  assert.deepEqual(draftContext(rows).map(c => c.rowId), ["1", "new"]);
  assert.deepEqual(draftContext(rows)[0].tags, ["Biology", "Two Words"]);
  assert.equal(draftContext(rows)[0].front, "Edited");
});

test("generation prepends unique unsaved IDs without modifying the draft", () => {
  const before = [row("1")];
  const result = applyAiResult(before, "generate", { cards: [{ front: "A", back: "B" }, { front: "C", back: "D" }] });
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map(r => r.tempId)).size, 3);
  assert.equal(result[0].cardId, null);
  assert.equal(result[0].tagNames, "");
  assert.equal(result[2], before[0]);
  assert.equal(before.length, 1);
});

test("correction matches row identity even with reordered results and preserves tags and deleted rows", () => {
  const before = [row("1"), row("2"), row("3", { isDeleted: true })];
  const after = applyAiResult(before, "correct", { cards: [{ rowId: "2", front: "Second", back: "B" }, { rowId: "1", front: "First", back: "A" }] });
  assert.deepEqual(after.map(r => r.tempId), ["1", "2", "3"]);
  assert.equal(after[0].front, "First");
  assert.equal(after[0].cardId, 1);
  assert.equal(after[0].tagNames, "Biology");
  assert.equal(after[2], before[2]);
});

test("tag suggestions are additive and reuse deck tag casing", () => {
  const before = [row("1", { tagNames: "#Biology, Unique" }), row("2", { tagNames: "Chemistry" })];
  const after = applyAiResult(before, "tags", { tags: [{ rowId: "1", tags: ["biology", "chemistry", "#New", "new"] }] });
  assert.equal(after[0].tagNames, "Biology, Chemistry, New, Unique");
  assert.equal(after[0].front, before[0].front);
  assert.equal(after[1], before[1]);
});

test("selected merge keeps oldest saved ID, unions tags and only deletes members", () => {
  const before = [row("new", { cardId: null }), row("7", { tagNames: "Physics" }), row("2"), row("9")];
  const after = applyMerges(before, [{ rowIds: ["new", "7", "2"], reason: "Same concept", front: "Merged", back: "Combined" }]);
  assert.equal(after[2].cardId, 2);
  assert.equal(after[2].front, "Merged");
  assert.equal(after[2].tagNames, "Biology, Physics");
  assert.equal(after[0].isDeleted, true);
  assert.equal(after[1].isDeleted, true);
  assert.equal(after[3], before[3]);
  assert.equal(changedRows(change(before, after)).length, 3);
});

test("all-unsaved merge keeps first draft row and rejects overlapping or missing members", () => {
  const before = [row("a", { cardId: null }), row("b", { cardId: null })];
  const group = { rowIds: ["b", "a"], reason: "Same", front: "Merged", back: "Back" };
  assert.equal(applyMerges(before, [group])[0].isDeleted, false);
  assert.throws(() => applyMerges(before, [group, group]));
  assert.throws(() => applyMerges(before, [{ ...group, rowIds: ["a", "missing"] }]));
});

test("undo restores AI fields while preserving later edits and manual additions", () => {
  const before = [row("1")];
  const after = applyAiResult(before, "enhance", { cards: [{ rowId: "1", front: "AI front", back: "AI back" }] });
  const current = [{ ...after[0], front: "Manual front" }, row("new", { cardId: null })];
  const result = undoAiChange(current, change(before, after));
  assert.equal(result.rows[0].front, "Manual front");
  assert.equal(result.rows[0].back, before[0].back);
  assert.equal(result.rows[1], current[1]);
  assert.equal(result.conflicts, 1);
  assert.equal(result.reverted, 1);
});

test("undo removes unchanged generated cards but keeps edited generated cards", () => {
  const after = applyAiResult([], "generate", { cards: [{ front: "A", back: "B" }, { front: "C", back: "D" }] });
  const current = [after[0], { ...after[1], tagNames: "Keep me" }];
  const result = undoAiChange(current, change([], after));
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].tagNames, "Keep me");
  assert.equal(result.conflicts, 1);
});

test("merge undo restores every original or preserves the whole conflicting group", () => {
  const before = [row("1"), row("2")];
  const after = applyMerges(before, [{ rowIds: ["1", "2"], reason: "Same", front: "Merged", back: "Back" }]);
  const record = change(before, after, [["1", "2"]]);
  assert.deepEqual(undoAiChange(after, record).rows, before);
  const current = [{ ...after[0], back: "Manual" }, after[1]];
  assert.deepEqual(undoAiChange(current, record).rows, current);
  assert.equal(undoAiChange(current, record).conflicts, 1);
});

test("undo does not resurrect manually deleted cards", () => {
  const before = [row("1")];
  const after = [{ ...before[0], front: "AI" }];
  const current = [{ ...after[0], isDeleted: true }];
  assert.deepEqual(undoAiChange(current, change(before, after)).rows, current);
});

function response(body: string, chunkSize = 1) {
  const bytes = new TextEncoder().encode(body);
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
    controller.close();
  } }), { headers: { "content-type": "text/event-stream" } });
}

test("SSE parser handles split UTF-8, CRLF, heartbeats and multiline data", async () => {
  let validated = false;
  const result = await readAiEvents(response(': processing\r\n\r\nevent: done\r\ndata: {"cards":\r\ndata: [{"front":"سلام","back":"Hi"}]}\r\n\r\n'), () => { validated = true; });
  assert.deepEqual(result, { cards: [{ front: "سلام", back: "Hi" }] });
  assert.equal(validated, true);
});

test("SSE parser rejects errors, missing terminal events, malformed JSON and login redirects", async () => {
  await assert.rejects(readAiEvents(response('event: error\ndata: {"message":"Context limit"}\n\n'), () => {}), /Context limit/);
  await assert.rejects(readAiEvents(response(': heartbeat\n\n'), () => {}), /before a complete response/);
  await assert.rejects(readAiEvents(response('event: done\ndata: {\n\n'), () => {}), /invalid response/);
  await assert.rejects(readAiEvents(new Response('<html>Login</html>'), () => {}), /session/);
  await assert.rejects(readAiEvents(new Response('', { status: 401 }), () => {}), /401/);
});
