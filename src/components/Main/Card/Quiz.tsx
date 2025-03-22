import '../../../Dark.css'
import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation} from "react-router-dom";
import {Deck} from "../../../constants/data/data.ts";
import {useState} from "react";
import {useCurrentUser} from "../../Shared/Authentication.ts";

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
    const card = deck.cards[currentCard];
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
            <div className={"quiz-card"} onClick={() => {setFlipped(!flipped)}}>{flipped ? card.back : card.front}</div>
            <br/>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetPreviousCardIndex(deck, currentCard))}}>{"<--Previous"}</button>
            <button className={"quiz-button"} onClick={() => {setFlipped(false); setCurrentCard(GetNextCardIndex(deck, currentCard))}}>{"Next-->"}</button>
        </div>
    )
}

export default Quiz;