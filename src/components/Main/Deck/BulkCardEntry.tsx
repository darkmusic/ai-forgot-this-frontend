import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import { Deck, Tag } from "../../../constants/data/data.ts";
import { postJson } from "../../../lib/api.ts";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import { TagMatchMode } from "../Shared/TagWidget.tsx";

interface BulkCardRow {
  cardId: number | null; // null for new cards, number for existing cards
  tempId: string;
  front: string;
  back: string;
  tagNames: string;
  isDeleted: boolean;
}

const canonicalizeTagName = (name: string) =>
  name.trim().replace(/^#+/, "").replace(/\s+/g, " ");

// Normalize for matching (case-insensitive)
const normalizeTagName = (name: string) => canonicalizeTagName(name).toLowerCase();

const formatTagNamesForDisplay = (tagNames: string) => {
  const uniqueByNorm = new Map<string, string>();
  for (const raw of (tagNames || "").split(",")) {
    const canonical = canonicalizeTagName(raw);
    if (!canonical) continue;
    const norm = normalizeTagName(canonical);
    if (!uniqueByNorm.has(norm)) uniqueByNorm.set(norm, canonical);
  }
  return Array.from(uniqueByNorm.values())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .join(", ");
};

const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content bulk-entry-modal">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const BulkCardEntry = ({
  isOpen,
  onClose,
  deck,
  onCardsCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  onCardsCreated?: () => void;
}) => {
  const [rows, setRows] = useState<BulkCardRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>("OR");

  type SortKey = "front" | "back" | "tagNames";
  const [sortKey, setSortKey] = useState<SortKey>("front");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [disableSorting, setDisableSorting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Default to sorting enabled each time the modal opens.
      setDisableSorting(false);
    }
  }, [isOpen]);

  // Prevent background (html/body) scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevHtmlPaddingRight = htmlEl.style.paddingRight;
    const prevBodyPaddingRight = bodyEl.style.paddingRight;

    // Optional: account for scrollbar width to avoid layout shift
    const scrollbarWidth = window.innerWidth - htmlEl.clientWidth;

    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      htmlEl.style.paddingRight = `${scrollbarWidth}px`;
      bodyEl.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      htmlEl.style.overflow = prevHtmlOverflow;
      bodyEl.style.overflow = prevBodyOverflow;
      htmlEl.style.paddingRight = prevHtmlPaddingRight;
      bodyEl.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isOpen]);

  // Load existing cards when modal opens
  useEffect(() => {
    if (isOpen && rows.length === 0) {
      // Convert existing cards to rows
      const existingCardRows: BulkCardRow[] = (deck.cards || []).map((card) => ({
        cardId: card.id,
        tempId: `card-${card.id}`,
        front: card.front || "",
        back: card.back || "",
        tagNames: (card.tags || [])
          .map((tag) => tag.name)
          .filter((n): n is string => !!n)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
          .join(", "),
        isDeleted: false,
      })).sort((a, b) => (a.cardId! - b.cardId!)); // Sort by cardId ascending

      setRows(existingCardRows);
    }
  }, [isOpen, deck.cards, rows.length]);

  const availableTags = useMemo<Tag[]>(() => {
    const byKey = new Map<string, Tag>();
    for (const card of deck.cards || []) {
      for (const tag of card.tags || []) {
        const name = tag?.name?.trim();
        if (!name) continue;
        const key = `${tag.id ?? "name"}:${name.toLowerCase()}`;
        if (!byKey.has(key)) {
          byKey.set(key, { id: tag.id ?? null, name });
        }
      }
    }
    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [deck.cards]);

  const availableTagsForFilter = availableTags.length > 0 ? availableTags : undefined;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  };

  const filteredAndSortedRows = useMemo(() => {
    if (disableSorting) {
      // When sorting is disabled, keep the list stable by bypassing all filters and sorting.
      return rows.filter((r) => !r.isDeleted);
    }

    const selectedNames = new Set(
      (selectedTags ?? [])
        .map((t) => t?.name)
        .filter((n): n is string => !!n)
        .map((n) => normalizeTagName(n))
    );

    const normalizedSearch = (searchText || "").trim().toLowerCase();

    const visible = rows
      .filter((r) => !r.isDeleted)
      .filter((r) => {
        if (!normalizedSearch) return true;
        return (
          (r.front || "").toLowerCase().includes(normalizedSearch) ||
          (r.back || "").toLowerCase().includes(normalizedSearch) ||
          (r.tagNames || "").toLowerCase().includes(normalizedSearch)
        );
      })
      .filter((r) => {
        if (selectedNames.size === 0) return true;
        const rowTagSet = new Set(
          (r.tagNames || "")
            .split(",")
            .map((t) => normalizeTagName(t))
            .filter((t) => t.length > 0)
        );

        const selected = Array.from(selectedNames);
        if (tagMatchMode === "AND") {
          return selected.every((t) => rowTagSet.has(t));
        }
        return selected.some((t) => rowTagSet.has(t));
      });

    const indexed = visible.map((r, idx) => ({ r, idx }));

    const getSortValue = (row: BulkCardRow): string => {
      switch (sortKey) {
        case "front":
          return (row.front || "").toLowerCase();
        case "back":
          return (row.back || "").toLowerCase();
        case "tagNames":
          return (row.tagNames || "").toLowerCase();
      }
    };

    indexed.sort((a, b) => {
      const av = getSortValue(a.r);
      const bv = getSortValue(b.r);
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      if (cmp !== 0) return sortDirection === "asc" ? cmp : -cmp;
      // Stable tiebreaker
      return a.idx - b.idx;
    });

    return indexed.map((x) => x.r);
  }, [rows, searchText, selectedTags, tagMatchMode, sortKey, sortDirection, disableSorting]);


  const handleCellChange = (tempId: string, field: keyof BulkCardRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    // Adding a new row while sorting is enabled causes it to jump around as the
    // user types in the sorted field. Auto-disable sorting to keep the new row stable.
    setDisableSorting(true);
    const newRow: BulkCardRow = {
      cardId: null,
      tempId: `new-${Date.now()}`,
      front: "",
      back: "",
      tagNames: "",
      isDeleted: false,
    };
    setRows((prev) => [newRow, ...prev]); // Add to top
  };

  const removeRow = (tempId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, isDeleted: true } : row
      )
    );
  };

  const handleSave = async () => {
    setError(null);

    // Separate rows into different categories
    const rowsToDelete = rows.filter((row) => row.isDeleted && row.cardId !== null);
    const rowsToUpdate = rows.filter(
      (row) => !row.isDeleted && row.cardId !== null && (row.front.trim() || row.back.trim())
    );
    const rowsToCreate = rows.filter(
      (row) => !row.isDeleted && row.cardId === null && (row.front.trim() || row.back.trim())
    );

    if (rowsToUpdate.length === 0 && rowsToCreate.length === 0 && rowsToDelete.length === 0) {
      setError("No changes to save.");
      return;
    }

    setIsSaving(true);

    try {
      // Build bulk payload
      const toItem = (row: BulkCardRow): { id: number|null; deckId: number; front: string; back: string; tags: string[] } => ({
        id: row.cardId,
        deckId: deck.id!,
        front: row.front,
        back: row.back,
        tags: (() => {
          const uniqueByNorm = new Map<string, string>();
          for (const raw of (row.tagNames || "").split(",")) {
            const canonical = canonicalizeTagName(raw);
            if (!canonical) continue;
            const norm = normalizeTagName(canonical);
            if (!uniqueByNorm.has(norm)) uniqueByNorm.set(norm, canonical);
          }
          return Array.from(uniqueByNorm.values()).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
          );
        })(),
      });

      const payload = {
        create: rowsToCreate.map(toItem),
        update: rowsToUpdate.map(toItem),
        deleteIds: rowsToDelete.map((r) => r.cardId as number),
      };

      await postJson("/api/card/bulk-save", payload);

      // Reset form
      setRows([]);
      setDisableSorting(false);
      if (onCardsCreated) {
        onCardsCreated();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save cards");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setRows([]);
    setError(null);
    setDisableSorting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="bulk-entry-container">
        <h2>Bulk Card Entry - {deck.name}</h2>
        <p className="bulk-entry-instructions">
          Edit existing cards or add new ones. Separate multiple tags with commas.
        </p>

        <div className="bulk-entry-filter">
          <SearchAndFilterWidget
            searchText={searchText}
            setSearchText={setSearchText}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            resultCount={filteredAndSortedRows.length}
            tagMatchMode={tagMatchMode}
            setTagMatchMode={setTagMatchMode}
            availableTags={availableTagsForFilter}
            allowTagCreation={false}
            tagPlaceholderText="Type to search tags in this deck..."
            disabled={disableSorting}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="bulk-entry-top-actions">
          <div className="bulk-entry-top-actions-left">
            <button type="button" className="bulk-entry-btn" onClick={addRow}>
              + Add New Card
            </button>
            <label className="bulk-entry-disable-sorting">
              <input
                type="checkbox"
                checked={disableSorting}
                onChange={(e) => setDisableSorting(e.target.checked)}
              />
              <span>Disable Sorting</span>
            </label>
          </div>

          <div className="bulk-entry-top-actions-right">
            <div className="bulk-entry-stats">
              {rows.filter((r) => !r.isDeleted && r.cardId === null).length > 0 && (
                <span className="bulk-entry-stat">
                  New: {rows.filter((r) => !r.isDeleted && r.cardId === null).length}
                </span>
              )}
              {rows.filter((r) => r.isDeleted).length > 0 && (
                <span className="bulk-entry-stat bulk-entry-stat-delete">
                  To Delete: {rows.filter((r) => r.isDeleted).length}
                </span>
              )}
            </div>
            <div className="bulk-entry-actions-right">
              <button
                type="button"
                className="bulk-entry-btn bulk-entry-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bulk-entry-btn bulk-entry-btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="bulk-entry-table-container">
          <table className="bulk-entry-table">
            <thead>
              {disableSorting && (
                <tr className="bulk-entry-sorting-disabled-row">
                  <th colSpan={4}>
                    <span className="bulk-entry-sorting-disabled-hint">Sorting disabled</span>
                  </th>
                </tr>
              )}
              <tr>
                <th className="bulk-entry-header">
                  <button
                    type="button"
                    className="bulk-entry-sort-button"
                    onClick={() => toggleSort("front")}
                    disabled={disableSorting}
                    aria-label={`Sort by Front ${sortKey === "front" ? (sortDirection === "asc" ? "descending" : "ascending") : "ascending"}`}
                  >
                    <span>Front</span>
                    <span className="bulk-entry-sort-indicator">{sortIndicator("front")}</span>
                  </button>
                </th>
                <th className="bulk-entry-header">
                  <button
                    type="button"
                    className="bulk-entry-sort-button"
                    onClick={() => toggleSort("back")}
                    disabled={disableSorting}
                    aria-label={`Sort by Back ${sortKey === "back" ? (sortDirection === "asc" ? "descending" : "ascending") : "ascending"}`}
                  >
                    <span>Back</span>
                    <span className="bulk-entry-sort-indicator">{sortIndicator("back")}</span>
                  </button>
                </th>
                <th className="bulk-entry-header">
                  <button
                    type="button"
                    className="bulk-entry-sort-button"
                    onClick={() => toggleSort("tagNames")}
                    disabled={disableSorting}
                    aria-label={`Sort by Tags ${sortKey === "tagNames" ? (sortDirection === "asc" ? "descending" : "ascending") : "ascending"}`}
                  >
                    <span>Tags (comma-separated)</span>
                    <span className="bulk-entry-sort-indicator">{sortIndicator("tagNames")}</span>
                  </button>
                </th>
                <th className="bulk-entry-header actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((row) => (
                  <tr key={row.tempId} className={row.cardId === null ? "new-row" : ""}>
                    <td>
                      <textarea
                        className="bulk-entry-textarea"
                        value={row.front}
                        onChange={(e) => handleCellChange(row.tempId, "front", e.target.value)}
                        placeholder="Front text"
                        rows={3}
                      />
                    </td>
                    <td>
                      <textarea
                        className="bulk-entry-textarea"
                        value={row.back}
                        onChange={(e) => handleCellChange(row.tempId, "back", e.target.value)}
                        placeholder="Back text"
                        rows={3}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="bulk-entry-input"
                        value={row.tagNames}
                        onChange={(e) => handleCellChange(row.tempId, "tagNames", e.target.value)}
                        onBlur={(e) => handleCellChange(row.tempId, "tagNames", formatTagNamesForDisplay(e.target.value))}
                        placeholder="tag1, tag2"
                      />
                    </td>
                    <td className="actions-column">
                      <button
                        type="button"
                        className="bulk-entry-remove-btn"
                        onClick={() => removeRow(row.tempId)}
                        title={row.cardId === null ? "Remove row" : "Delete card"}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default BulkCardEntry;
