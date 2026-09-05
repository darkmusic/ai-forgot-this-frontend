import { cloneElement, useEffect, useId, useRef, useState } from "react";
import type { ReactElement } from "react";
import { apiFetch } from "../../../lib/api";
import { readAiEvents } from "../../../lib/aiEvents";
import {
  applyAiResult, applyMerges, changedRows, draftContext, eligibleRows, undoAiChange,
} from "../../../lib/deckAssist";
import type { AiChange, AiOperation, AiResult, BulkCardRow, MergeProposal, TopicProposal } from "../../../lib/deckAssist";

const labels: Record<AiOperation, string> = {
  generate: "Generating cards", correct: "Correcting deck", enhance: "Enhancing deck",
  duplicates: "Finding duplicates", tags: "Suggesting tags", gaps: "Finding topic gaps",
};
const contextHelp = "Uses the deck name and all current draft cards, including unsaved changes and cards hidden by filters, at the configured AI endpoint. ";
const saveHelp = " Review changes here, then use Save All Changes to persist them.";

function Help({ text, children }: { text: string; children: ReactElement<{ "aria-describedby"?: string; disabled?: boolean }> }) {
  const id = useId();
  return <span className="bulk-ai-help" tabIndex={children.props.disabled ? 0 : undefined} aria-describedby={children.props.disabled ? id : undefined}>
    {cloneElement(children, { "aria-describedby": id })}
    <span role="tooltip" id={id} className="bulk-ai-tooltip">{text}</span>
  </span>;
}

function ToolButton({ text, children, disabled, onClick }: { text: string; children: string; disabled?: boolean; onClick: () => void }) {
  return <Help text={text}><button type="button" className="bulk-entry-btn" disabled={disabled} onClick={onClick}>{children}</button></Help>;
}

function CardText({ row }: { row: Pick<BulkCardRow, "front" | "back" | "tagNames"> }) {
  return <div className="bulk-ai-card-text"><strong>Front</strong><pre>{row.front}</pre><strong>Back</strong><pre>{row.back}</pre><strong>Tags</strong><pre>{row.tagNames || "(none)"}</pre></div>;
}

export default function BulkAiTools({ deckName, rows, isSaving, onRows, onBusy, onGenerated }: {
  deckName: string; rows: BulkCardRow[]; isSaving: boolean;
  onRows: (rows: BulkCardRow[]) => void; onBusy: (busy: boolean) => void; onGenerated: () => void;
}) {
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("match");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [isError, setIsError] = useState(false);
  const [change, setChange] = useState<AiChange | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [proposals, setProposals] = useState<{ snapshot: BulkCardRow[]; groups?: MergeProposal[]; topics?: TopicProposal[] } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const controller = useRef<AbortController | null>(null);
  const currentRows = useRef(rows);
  currentRows.current = rows;

  useEffect(() => () => {
    controller.current?.abort("Editor closed.");
    controller.current = null;
    onBusy(false);
  }, [onBusy]);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  const activeProposals = proposals?.snapshot === rows ? proposals : null;
  const visibleStatus = proposals && !activeProposals && !busy && !isError
    ? "Draft changed. Run duplicate or topic analysis again for fresh suggestions." : status;
  const eligible = eligibleRows(rows).length;
  const disabled = busy || isSaving;
  const countValid = /^\d+$/.test(count) && Number(count) >= 1 && Number(count) <= 100;
  const toggleSelected = (index: number) => setSelected(previous => previous.includes(index) ? previous.filter(i => i !== index) : [...previous, index]);

  const stage = (label: string, snapshot: BulkCardRow[], after: BulkCardRow[], merges: string[][] = []) => {
    const next = { label, before: snapshot, after, merges };
    const changed = changedRows(next).length;
    if (changed) {
      setChange(next);
      setShowCompare(false);
      setProposals(null);
      onRows(after);
    }
    setStatus(changed ? `${label}: ${changed} cards changed. Review changes, then Save All Changes.` : `${label}: no changes needed.`);
    setIsError(false);
  };

  const run = async (operation: AiOperation, topics?: string[]) => {
    if (controller.current || isSaving) return;
    if (operation === "generate" && !countValid) { setIsError(true); setStatus("Choose a whole number of cards from 1 to 100."); return; }
    const snapshot = rows;
    const request = new AbortController();
    controller.current = request;
    setBusy(true); onBusy(true); setElapsed(0); setIsError(false); setStatus(labels[operation]);
    const timeout = window.setTimeout(() => request.abort("AI request timed out. Try fewer cards or check the endpoint."), 12 * 60 * 1000);
    try {
      const response = await apiFetch("/api/ai/deck-assist", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify({ operation, deckName, cards: draftContext(snapshot),
          count: operation === "generate" ? Number(count) : undefined,
          difficulty: operation === "generate" ? difficulty : undefined, topics, instructions }),
        signal: request.signal,
      });
      const result = await readAiEvents<AiResult>(response, () => {
        if (controller.current === request) setStatus("Validating response");
      });
      if (controller.current !== request || request.signal.aborted) return;
      if (currentRows.current !== snapshot) throw new Error("The draft changed during the request. Run the operation again with the current draft.");
      if (operation === "duplicates" || operation === "gaps") {
        setProposals({ snapshot, groups: result.groups, topics: result.topics }); setSelected([]);
        const total = result.groups?.length ?? result.topics?.length ?? 0;
        setStatus(total ? `${total} ${operation === "duplicates" ? "duplicate groups" : "topic gaps"} ready for review.`
          : operation === "duplicates" ? "No duplicates found." : "No clear topic gaps found.");
      } else {
        stage(operation === "generate" ? "Generated cards" : labels[operation], snapshot, applyAiResult(snapshot, operation, result));
        if (operation === "generate") onGenerated();
      }
    } catch (error) {
      if (controller.current !== request) return;
      setIsError(true);
      setStatus(request.signal.aborted ? String(request.signal.reason) : error instanceof Error ? error.message : "The AI operation failed. No changes were applied.");
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === request) { controller.current = null; setBusy(false); onBusy(false); }
    }
  };

  const merge = () => {
    if (disabled || !activeProposals?.groups || !selected.length) return;
    const groups = activeProposals.groups.filter((_, i) => selected.includes(i));
    try { stage("Merged duplicates", rows, applyMerges(rows, groups), groups.map(g => g.rowIds)); }
    catch (error) { setIsError(true); setStatus(error instanceof Error ? error.message : "Merge failed."); }
  };

  const undo = () => {
    if (disabled || !change) return;
    const result = undoAiChange(rows, change);
    onRows(result.rows); setProposals(null); setChange(null); setShowCompare(false);
    setIsError(false); setStatus(`Undo: ${result.reverted} changes reverted; ${result.conflicts} conflicts preserved.${result.conflicts ? " Later edits were kept." : ""}`);
  };

  return <fieldset className="bulk-ai-tools" aria-busy={busy}>
    <legend>AI tools</legend>
    <div className="bulk-ai-controls">
      <label className="bulk-ai-count">Cards <Help text="Total number of additional cards to generate, from 1 to 100, across all selected topics. Used by Generate / Add Cards and Generate Cards for Selected Topics only.">
        <input type="number" min={1} max={100} step={1} value={count} disabled={disabled} aria-label="Number of cards" aria-invalid={!countValid} onChange={e => setCount(e.target.value)} />
      </Help></label>
      <ToolButton disabled={disabled || !countValid} onClick={() => void run("generate")} text={contextHelp + "Generate the requested number of additional, distinct cards at the selected difficulty." + saveHelp}>Generate / Add Cards</ToolButton>
      <ToolButton disabled={disabled || !eligible} onClick={() => void run("correct")} text={contextHelp + "Correct factual inaccuracies in front/back text, preserving tags and card identities. Needs at least one nonempty card." + saveHelp}>Correct Deck</ToolButton>
      <ToolButton disabled={disabled || !eligible} onClick={() => void run("enhance")} text={contextHelp + "Improve explanations, examples, clarity and Markdown formatting in front/back text. Needs at least one nonempty card." + saveHelp}>Enhance Deck</ToolButton>
    </div>
    <details className="bulk-ai-options">
      <summary>More tools &amp; options</summary>
      <div className="bulk-ai-controls">
        <ToolButton disabled={disabled || eligible < 2} onClick={() => void run("duplicates")} text={contextHelp + "Find duplicate concepts and propose merged cards. Review and select groups before staging merges. Needs at least two cards."}>Find Duplicates</ToolButton>
        <ToolButton disabled={disabled || !eligible} onClick={() => void run("tags")} text={contextHelp + "Add relevant tags, reusing deck tag names and preserving existing tags and card text." + saveHelp}>Suggest Tags</ToolButton>
        <ToolButton disabled={disabled} onClick={() => void run("gaps")} text={contextHelp + "Suggest underrepresented topics. Select topics before generating additional cards; analysis alone changes nothing."}>Fill Topic Gaps</ToolButton>
        <label>Difficulty <Help text="Difficulty for Generate / Add Cards and Generate Cards for Selected Topics. Match deck follows the current cards; other operations preserve existing difficulty.">
          <select value={difficulty} disabled={disabled} onChange={e => setDifficulty(e.target.value)} aria-label="Generation difficulty">
            <option value="match">Match deck</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </Help></label>
      </div>
      <label className="bulk-ai-instructions">Custom instructions <Help text="Optional language, audience, style or formatting preferences sent with every AI request. Maximum 2,000 characters. Cannot override card identity, operation boundaries or additive tag behavior. Resets when this editor closes.">
        <textarea value={instructions} maxLength={2000} rows={2} disabled={disabled} onChange={e => setInstructions(e.target.value)} placeholder="For example: use Spanish, for beginners, with brief examples…" aria-label="Custom AI instructions" />
      </Help></label>
    </details>
    <div className={`bulk-ai-status${isError ? " bulk-ai-error" : ""}`}>
      <span role={isError ? "alert" : "status"} aria-atomic="true">{busy && <span className="spinner" aria-hidden="true" />} {visibleStatus}</span>
      {busy && <span aria-label="Elapsed time">{elapsed}s</span>}
      {change && <>
        <ToolButton disabled={busy} onClick={() => setShowCompare(v => !v)} text="Show or hide before/after content and tags for the most recent staged AI operation. Later manual edits are not part of this comparison.">Compare Changes</ToolButton>
        <ToolButton disabled={disabled} onClick={undo} text="Undo the last staged AI operation while preserving later manual edits. Conflicting fields, edited new cards, and changed merge groups are kept and reported. One level, no redo; available until saving or closing.">Undo Last AI Change</ToolButton>
      </>}
    </div>
    {showCompare && change && <div className="bulk-ai-review" aria-label="AI change comparison">
      <p>{change.label} — before and after the AI operation</p>
      {changedRows(change).map(({ before, after }, index) => <details key={after.tempId}>
        <summary>{index + 1}. {!before ? "Added" : after.isDeleted ? "Marked for deletion" : "Updated"}: {(after.front || after.back).slice(0, 90)}</summary>
        <div className="bulk-ai-comparison"><div><h4>Before</h4>{before ? <CardText row={before} /> : <p>New card</p>}</div><div><h4>After</h4><CardText row={after} /></div></div>
      </details>)}
    </div>}
    {!!activeProposals?.groups?.length && <div className="bulk-ai-review" aria-label="Duplicate suggestions">
      <p>Select merges to stage. The oldest saved card survives with its review history; other cards are marked for deletion. Histories are not combined. Tags are combined.</p>
      {activeProposals.groups.map((group, index) => <div key={index} className="bulk-ai-proposal">
        <label><Help text="Select this duplicate group for Apply Selected Merges. Unselected groups remain unchanged."><input type="checkbox" checked={selected.includes(index)} disabled={disabled} onChange={() => toggleSelected(index)} aria-label={`Select merge ${index + 1}`} /></Help> {group.reason}</label>
        <details><summary>Original cards and proposed merge</summary><div className="bulk-ai-comparison"><div><h4>Original cards</h4>{rows.filter(r => group.rowIds.includes(r.tempId)).map(r => <CardText key={r.tempId} row={r} />)}</div><div><h4>Proposed merged card</h4><CardText row={{ ...group, tagNames: "Combined from original cards" }} /></div></div></details>
      </div>)}
      <ToolButton disabled={disabled || !selected.length} onClick={merge} text={"Stage only selected merges. Keep the oldest saved card (or first unsaved row), combine tags and mark other group members for deletion. The survivor keeps its review history; histories are not combined." + saveHelp}>Apply Selected Merges</ToolButton>
    </div>}
    {!!activeProposals?.topics?.length && <div className="bulk-ai-review" aria-label="Topic gap suggestions">
      {activeProposals.topics.map((topic, index) => <label className="bulk-ai-proposal" key={topic.topic}>
        <Help text="Include this topic when generating cards for selected topics. The card count is shared across all selected topics."><input type="checkbox" checked={selected.includes(index)} disabled={disabled} onChange={() => toggleSelected(index)} aria-label={`Select topic: ${topic.topic}`} /></Help> <strong>{topic.topic}</strong> — {topic.reason}
      </label>)}
      <ToolButton disabled={disabled || !selected.length || !countValid} onClick={() => void run("generate", activeProposals.topics!.filter((_, i) => selected.includes(i)).map(t => t.topic))} text={contextHelp + "Generate the specified TOTAL number of cards across selected topics at the chosen difficulty, using custom instructions." + saveHelp}>Generate Cards for Selected Topics</ToolButton>
    </div>}
  </fieldset>;
}
