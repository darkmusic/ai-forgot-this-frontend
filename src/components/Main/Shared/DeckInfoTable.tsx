import { Deck } from "../../../constants/data/data.ts";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BulkCardEntry from "../Deck/BulkCardEntry.tsx";

const DeckRow = ({ deck, onRefresh }: { deck: Deck | null; onRefresh?: () => void }) => {
  const navigate = useNavigate();
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);

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
