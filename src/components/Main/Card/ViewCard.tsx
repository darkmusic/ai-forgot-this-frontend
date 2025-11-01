import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useLocation } from "react-router-dom";
import { Card, Deck } from "../../../constants/data/data.ts";
import DeckWidget from "../Shared/DeckWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";

const ViewCard = () => {
  const { state } = useLocation();
  const card = state?.card as Card;
  const deck = state?.deck as Deck;
  const user = useCurrentUser();

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div>
      <DeckWidget />
      <UserProfileWidget user={user} />
      <h2>View Card</h2>
      <div className={"quiz-card"}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {PrepareCardMarkdown(deck.templateFront, card.front)}
        </ReactMarkdown>
      </div>
      <br />
      <div className={"quiz-card"}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {PrepareCardMarkdown(deck.templateBack, card.back)}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ViewCard;
