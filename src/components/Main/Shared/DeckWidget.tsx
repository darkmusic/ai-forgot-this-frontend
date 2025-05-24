import '../../../css/themes.css'
import {useLocation, useNavigate} from "react-router-dom";
import {Deck} from "../../../constants/data/data.ts";

const DeckWidget = () => {
    const { state } = useLocation();
    const deck = state?.deck as Deck;
    const navigate = useNavigate();
    const deckRoute = () => {
        const path = '/deck/edit';
        navigate(path, {state: {deck: deck}});
    }

  return (
    <div>
        <button className={"nav-button"} onClick={deckRoute}>Return to Deck</button>
    </div>
  );
}

export default DeckWidget;