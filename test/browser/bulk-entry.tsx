import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import BulkCardEntry from "../../src/components/Main/Deck/BulkCardEntry";
import { getJson } from "../../src/lib/api";
import type { Deck } from "../../src/constants/data/data";
import "../../src/css/index.css";
import "../../src/css/themes.css";

function Harness() {
  const [open, setOpen] = useState(true);
  const [deck, setDeck] = useState<Deck>({ id: 1, name: "General knowledge", description: "", templateFront: "", templateBack: "", cards: [
    { id: 1, front: "Capital of France?", back: "Paris", tags: [{ id: 1, name: "Geography" }] },
    { id: 2, front: "French capital city?", back: "Paris", tags: [] },
    { id: 3, front: "Water formula?", back: "H20", tags: [] },
  ] });
  return <><button onClick={() => setOpen(true)}>Open editor</button>
    <BulkCardEntry isOpen={open} onClose={() => setOpen(false)} deck={deck}
      onCardsCreated={() => void getJson<Deck>("/api/deck/1").then(setDeck)} />
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Harness /></StrictMode>);
