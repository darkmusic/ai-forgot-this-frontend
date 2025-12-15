import { Deck, SrsStatsResponse } from "../../../constants/data/data.ts";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BulkCardEntry from "../Deck/BulkCardEntry.tsx";
import { getJson } from "../../../lib/api.ts";

const DeckRow = ({ deck, onRefresh }: { deck: Deck | null; onRefresh?: () => void }) => {
  const navigate = useNavigate();
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [srsStats, setSrsStats] = useState<{
    due: number;
    newCount: number;
    reviewed: number;
    total: number;
    loading: boolean;
    error?: string;
  } | null>(null);

  const handleBulkEntryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsBulkEntryOpen(true);
  };

  const handleBulkEntryClose = () => {
    setIsBulkEntryOpen(false);
  };

  const handleCardsCreated = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  useEffect(() => {
    const fetchDeckSrsStats = async () => {
      if (!deck || !deck.id) {
        setSrsStats(null);
        return;
      }
      try {
        setSrsStats((prev) => ({ ...(prev || { due: 0, newCount: 0, reviewed: 0, total: 0 }), loading: true }));
        const stats = await getJson<SrsStatsResponse>(`/api/srs/stats?deckId=${deck.id}`);
        setSrsStats({
          due: stats.dueCards,
          newCount: stats.newCards,
          reviewed: stats.reviewedCards,
          total: stats.totalCards,
          loading: false,
        });
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : e && typeof e === "object" && "message" in e
              ? String((e as { message?: unknown }).message)
              : String(e);
        setSrsStats({
          due: 0,
          newCount: 0,
          reviewed: 0,
          total: deck?.cards?.length || 0,
          loading: false,
          error: message,
        });
        console.error("Failed to load per-deck SRS stats", e);
      }
    };

    fetchDeckSrsStats();
  }, [deck]);

  return (
    <tr>
      {deck === null ? (
        <td className={"edit-td-header"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: null } })}
          >
            {"<new>"}
          </a>
        </td>
      ) : (
        <td className={"edit-td-header deck-name"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: deck } })}
          >
            {deck.name}
          </a>
        </td>
      )}
      {deck === null ? (
        <td className={"edit-td-header"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: null } })}
          >
            {"<new>"}
          </a>
        </td>
      ) : (
        <td className={"edit-td-header deck-description"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: deck } })}
          >
            {deck.description}
          </a>
        </td>
      )}
      {deck === null ? (
        <>
          <td className={"edit-td-data"}>-</td>
          <td className={"edit-td-data"}>-</td>
          <td className={"edit-td-data"}>-</td>
          <td className={"edit-td-data"}>-</td>
        </>
      ) : (
        <>
          <td className={"edit-td-data"} title="Cards due now (includes New)">{srsStats?.loading ? <span className="spinner" /> : srsStats?.due ?? "-"}</td>
          <td className={"edit-td-data"} title="Cards never reviewed in this deck">{srsStats?.loading ? <span className="spinner" /> : srsStats?.newCount ?? "-"}</td>
          <td className={"edit-td-data"} title="Cards with an existing SRS record">{srsStats?.loading ? <span className="spinner" /> : srsStats?.reviewed ?? "-"}</td>
          <td className={"edit-td-data"} title="All cards in this deck">{srsStats?.loading ? <span className="spinner" /> : srsStats?.total ?? deck.cards?.length ?? "-"}</td>
        </>
      )}
      {deck === null ? (
        <td className={"edit-td-data"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: null } })}
          >
            Create...
          </a>
        </td>
      ) : (
        <td className={"edit-td-data"}>
          <a
            className={"link-pointer"}
            onClick={() => navigate("/deck/edit", { state: { deck: deck } })}
          >
            View/Edit
          </a>
          {" | "}
          <a
            className={"link-pointer"}
            onClick={() => navigate("/cram", { state: { deck: deck } })}
          >
            Cram
          </a>
          {" | "}
          <a
            className={"link-pointer"}
            onClick={() => navigate("/review", { state: { deck: deck } })}
          >
            Start Review Session
          </a>
          {" | "}
          <a
            className={"link-pointer"}
            onClick={handleBulkEntryClick}
          >
            Bulk Entry
          </a>
        </td>
      )}
      {deck && (
        <BulkCardEntry
          isOpen={isBulkEntryOpen}
          onClose={handleBulkEntryClose}
          deck={deck}
          onCardsCreated={handleCardsCreated}
        />
      )}
    </tr>
  );
};

const DeckInfoTable = ({ decks, onRefresh }: { decks: Deck[]; onRefresh?: () => void }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <td className="table-header">Deck Name</td>
          <td className="table-header">Description</td>
          <td className="table-header">Due</td>
          <td className="table-header">New</td>
          <td className="table-header">Reviewed</td>
          <td className="table-header">Total</td>
          <td className="table-header">Actions</td>
        </tr>
      </thead>
      <tbody>
        <DeckRow key={"<new>"} deck={null} onRefresh={onRefresh} />
        {decks.map((deck) => (
          <DeckRow key={deck.name} deck={deck} onRefresh={onRefresh} />
        ))}
      </tbody>
    </table>
  );
};

export default DeckInfoTable;
