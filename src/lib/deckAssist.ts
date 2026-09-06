export interface BulkCardRow {
  cardId: number | null;
  tempId: string;
  front: string;
  back: string;
  tagNames: string;
  isDeleted: boolean;
}

export type AiOperation = "generate" | "correct" | "enhance" | "duplicates" | "tags" | "gaps";
export interface AiCard { rowId?: string; front: string; back: string }
export interface MergeProposal { rowIds: string[]; reason: string; front: string; back: string }
export interface TopicProposal { topic: string; reason: string }
export interface AiResult {
  cards?: AiCard[];
  groups?: MergeProposal[];
  tags?: { rowId: string; tags: string[] }[];
  topics?: TopicProposal[];
}
export interface AiChange {
  label: string;
  before: BulkCardRow[];
  after: BulkCardRow[];
  merges: string[][];
}

// These IDs only live in the editor. A counter also works on HTTP LAN origins
// where crypto.randomUUID is unavailable, and avoids same-millisecond collisions.
let nextRowId = 0;
export const newDraftRowId = () => `new-${Date.now()}-${++nextRowId}`;

export const canonicalTag = (name: string) => name.trim().replace(/^#+/, "").replace(/\s+/g, " ");
export const normalizeTag = (name: string) => canonicalTag(name).toLowerCase();
export function unionTags(names: string[]): string[] {
  const tags = new Map<string, string>();
  for (const name of names) {
    const canonical = canonicalTag(name);
    if (canonical && !tags.has(normalizeTag(canonical))) tags.set(normalizeTag(canonical), canonical);
  }
  return [...tags.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export const eligibleRows = (rows: BulkCardRow[]) => rows.filter(r => !r.isDeleted && (r.front.trim() || r.back.trim()));
export const draftContext = (rows: BulkCardRow[]) => eligibleRows(rows).map(r => ({
  rowId: r.tempId, front: r.front, back: r.back, tags: unionTags(r.tagNames.split(",")),
}));

export function sameRow(a: BulkCardRow | undefined, b: BulkCardRow | undefined): boolean {
  return !!a && !!b && a.tempId === b.tempId && a.cardId === b.cardId && a.front === b.front
    && a.back === b.back && a.tagNames === b.tagNames && a.isDeleted === b.isDeleted;
}

export function changedRows(change: AiChange) {
  const before = new Map(change.before.map(r => [r.tempId, r]));
  return change.after.filter(r => !sameRow(before.get(r.tempId), r)).map(after => ({ before: before.get(after.tempId), after }));
}

/** Only validated server results enter here. Never mutate the captured draft. */
export function applyAiResult(rows: BulkCardRow[], operation: AiOperation, result: AiResult): BulkCardRow[] {
  if (operation === "generate") {
    return [...(result.cards ?? []).map(c => ({
      cardId: null, tempId: newDraftRowId(), front: c.front, back: c.back, tagNames: "", isDeleted: false,
    })), ...rows];
  }
  if (operation === "correct" || operation === "enhance") {
    const cards = new Map(result.cards?.map(c => [c.rowId, c]));
    return rows.map(r => {
      const c = cards.get(r.tempId);
      return !r.isDeleted && c ? { ...r, front: c.front, back: c.back } : r;
    });
  }
  if (operation === "tags") {
    const existing = new Map<string, string>();
    for (const r of rows.filter(r => !r.isDeleted)) for (const tag of unionTags(r.tagNames.split(","))) existing.set(normalizeTag(tag), tag);
    const tags = new Map(result.tags?.map(t => [t.rowId, t.tags.map(tag => existing.get(normalizeTag(tag)) ?? canonicalTag(tag))]));
    return rows.map(r => !r.isDeleted && tags.has(r.tempId)
      ? { ...r, tagNames: unionTags([...r.tagNames.split(","), ...tags.get(r.tempId)!]).join(", ") } : r);
  }
  return rows;
}

export function applyMerges(rows: BulkCardRow[], groups: MergeProposal[]): BulkCardRow[] {
  const changes = new Map<string, BulkCardRow>();
  const used = new Set<string>();
  for (const group of groups) {
    const members = rows.filter(r => group.rowIds.includes(r.tempId) && !r.isDeleted);
    if (members.length !== group.rowIds.length || members.length < 2 || group.rowIds.some(id => used.has(id))
      || new Set(group.rowIds).size !== group.rowIds.length) throw new Error("Duplicate suggestions are no longer valid. Analyze the draft again.");
    group.rowIds.forEach(id => used.add(id));
    const survivor = [...members].sort((a, b) => (a.cardId ?? Infinity) - (b.cardId ?? Infinity))[0];
    const tags = unionTags(members.flatMap(r => r.tagNames.split(","))).join(", ");
    for (const row of members) changes.set(row.tempId, row === survivor
      ? { ...row, front: group.front, back: group.back, tagNames: tags }
      : { ...row, isDeleted: true });
  }
  return rows.map(r => changes.get(r.tempId) ?? r);
}

/** Undo only AI-owned values. Merge groups are restored together or not at all. */
export function undoAiChange(rows: BulkCardRow[], change: AiChange) {
  const current = new Map(rows.map(r => [r.tempId, r]));
  const before = new Map(change.before.map(r => [r.tempId, r]));
  const after = new Map(change.after.map(r => [r.tempId, r]));
  const handled = new Set<string>();
  let reverted = 0;
  let conflicts = 0;
  for (const group of change.merges) {
    group.forEach(id => handled.add(id));
    if (group.every(id => sameRow(current.get(id), after.get(id)))) {
      group.forEach(id => current.set(id, before.get(id)!));
      reverted += group.length;
    } else conflicts++;
  }
  for (const { before: old, after: applied } of changedRows(change)) {
    if (handled.has(applied.tempId)) continue;
    const now = current.get(applied.tempId);
    if (!old) {
      if (sameRow(now, applied)) { current.delete(applied.tempId); reverted++; }
      else conflicts++;
      continue;
    }
    if (!now || now.isDeleted !== applied.isDeleted) { conflicts++; continue; }
    const restored = { ...now };
    for (const field of ["front", "back", "tagNames"] as const) {
      if (old[field] === applied[field]) continue;
      if (now[field] === applied[field]) { restored[field] = old[field]; reverted++; }
      else conflicts++;
    }
    current.set(applied.tempId, restored);
  }
  return { rows: rows.filter(r => current.has(r.tempId)).map(r => current.get(r.tempId)!), reverted, conflicts };
}
