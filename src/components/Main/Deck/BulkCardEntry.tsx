import { useState, useEffect } from "react";
import * as React from "react";
import { Deck } from "../../../constants/data/data.ts";
import { postJson } from "../../../lib/api.ts";

interface BulkCardRow {
  cardId: number | null; // null for new cards, number for existing cards
  tempId: string;
  front: string;
  back: string;
  tagNames: string;
  isDeleted: boolean;
}

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

  // Normalize a tag name (trim and collapse spaces)
  const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

  // (Note) normalizeTagName used to prepare tag strings for backend bulk API

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
        tagNames: (card.tags || []).map((tag) => tag.name).join(", "),
        isDeleted: false,
      })).sort((a, b) => (a.cardId! - b.cardId!)); // Sort by cardId ascending

      setRows(existingCardRows);
    }
  }, [isOpen, deck.cards]);

  const handleCellChange = (tempId: string, field: keyof BulkCardRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
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
        tags: (row.tagNames || "")
          .split(",")
          .map((t) => normalizeTagName(t))
          .filter((t) => t.length > 0),
      });

      const payload = {
        create: rowsToCreate.map(toItem),
        update: rowsToUpdate.map(toItem),
        deleteIds: rowsToDelete.map((r) => r.cardId as number),
      };

      await postJson("/api/card/bulk-save", payload);

      // Reset form
      setRows([]);
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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="bulk-entry-container">
        <h2>Bulk Card Entry - {deck.name}</h2>
        <p className="bulk-entry-instructions">
          Edit existing cards or add new ones. Separate multiple tags with commas.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="bulk-entry-top-actions">
          <button type="button" className="bulk-entry-btn" onClick={addRow}>
            + Add New Card
          </button>
        </div>

        <div className="bulk-entry-table-container">
          <table className="bulk-entry-table">
            <thead>
              <tr>
                <th className="bulk-entry-header">Front</th>
                <th className="bulk-entry-header">Back</th>
                <th className="bulk-entry-header">Tags (comma-separated)</th>
                <th className="bulk-entry-header actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => !row.isDeleted)
                .map((row) => (
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

        <div className="bulk-entry-actions">
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
    </Modal>
  );
};

export default BulkCardEntry;
