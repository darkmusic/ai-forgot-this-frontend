import 'katex/dist/katex.min.css'
import '../../../css/themes.css'
import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation} from "react-router-dom";
import {Card, Deck} from "../../../constants/data/data.ts";
import {useState} from "react";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

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
            <div className={"quiz-card"} onClick={() => {setFlipped(!flipped)}}><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flipped ? deck.templateBack.concat(' ', card.back) : deck.templateFront.concat(' ', card.front)}</ReactMarkdown></div>
            <br/>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetPreviousCardIndex(deck, currentCard))}}>{"<--Previous"}</button>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetNextCardIndex(deck, currentCard))}}>{"Next-->"}</button>
        </div>
    )
}

export default Quiz;