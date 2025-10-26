import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation} from "react-router-dom";
import {Card, Deck} from "../../../constants/data/data.ts";
import {useState} from "react";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {PrepareCardMarkdown} from "../../Shared/CardUtility.ts";

const GetPreviousCardIndex = (deck: Deck, currentCard: number) => {
    if (currentCard === 0) {
        return deck.cards.length - 1;
    }
    return currentCard - 1;
}

const GetNextCardIndex = (deck: Deck, currentCard: number) => {
    if (currentCard === deck.cards.length - 1) {
        return 0;
    }
    return currentCard + 1;
}

const Quiz = () => {
    const { state } = useLocation();
    const deck = state?.deck as Deck;
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const card = deck.cards[currentCard] as Card;
    const user = useCurrentUser();

    if (!user) {
        return <div>Loading user profile...</div>
    }

    return (
        <div>
            <HomeWidget/>
            <UserProfileWidget user={user} />
            <div className={"quiz-header"}>Deck: {deck.name}</div>
            <br/>
            <br/>
            <div className={"quiz-card"} onClick={() => {setFlipped(!flipped)}}><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flipped ? PrepareCardMarkdown(deck.templateBack, card.back) : PrepareCardMarkdown(deck.templateFront, card.front)}</ReactMarkdown></div>
            <br/>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetPreviousCardIndex(deck, currentCard))}}>{"<--Previous"}</button>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetNextCardIndex(deck, currentCard))}}>{"Next-->"}</button>
        </div>
    )
}

export default Quiz;