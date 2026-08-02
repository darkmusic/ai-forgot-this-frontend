import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useLocation } from "react-router-dom";
import { Card, Deck } from "../../../constants/data/data.ts";
import DeckWidget from "../Shared/DeckWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import Markdown from "../../Shared/Markdown.tsx";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";
import TtsAudioControl from "../Shared/TtsAudioControl.tsx";

const ViewCard = () => {
  const { state } = useLocation();
  const card = state?.card as Card;
  const deck = state?.deck as Deck;
  const user = useCurrentUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <DeckWidget />
      <UserProfileWidget user={user} />
      <h2>View Card</h2>
      <div className={"quiz-card"}>
        <Markdown>
          {PrepareCardMarkdown(deck.templateFront, card.front)}
        </Markdown>
        <TtsAudioControl card={card} deck={deck} side="FRONT" />
      </div>
      <br />
      <div className={"quiz-card"}>
        <Markdown>
          {PrepareCardMarkdown(deck.templateBack, card.back)}
        </Markdown>
        <TtsAudioControl card={card} deck={deck} side="BACK" />
      </div>
    </div>
  );
};

export default ViewCard;
