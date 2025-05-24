import '../../../css/themes.css'
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation} from "react-router-dom";
import {Card} from "../../../constants/data/data.ts";
import DeckWidget from "../Shared/DeckWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";

const ViewCard = () => {
    const { state } = useLocation();
    const card = state?.card as Card;
    const user = useCurrentUser();

    if (!user) {
        return <div>Loading user profile...</div>
    }

    return (
        <div>
            <DeckWidget/>
            <UserProfileWidget user={user}/>
            <h2>View Card</h2>
            <div className={"quiz-card"}>{card.front}</div>
            <br/>
            <div className={"quiz-card"}>{card.back}</div>
        </div>
    )
}

export default ViewCard;