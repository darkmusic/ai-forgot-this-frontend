import 'katex/dist/katex.min.css'
import '../../../css/themes.css'
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation} from "react-router-dom";
import {Card, Deck} from "../../../constants/data/data.ts";
import DeckWidget from "../Shared/DeckWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const ViewCard = () => {
    const { state } = useLocation();
    const card = state?.card as Card;
    const deck = state?.deck as Deck;
    const user = useCurrentUser();

    if (!user) {
        return <div>Loading user profile...</div>
    }

    return (
        <div>
            <DeckWidget/>
            <UserProfileWidget user={user}/>
            <h2>View Card</h2>
            <div className={"quiz-card"}><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{deck.templateFront.concat(' ', card.front)}</ReactMarkdown></div>
            <br/>
            <div className={"quiz-card"}><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{deck.templateBack.concat(' ', card.back)}</ReactMarkdown></div>
        </div>
    )
}

export default ViewCard;