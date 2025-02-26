import UserProfileWidget from "./UserProfileWidget.tsx";
import SearchAndFilterWidget from "./SearchAndFilterWidget.tsx";
import {Card, Deck, Tag} from "../constants/data/data.ts";
import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import HomeWidget from "./HomeWidget.tsx";
import DeckInfoTable from "./DeckInfoTable.tsx";
import {FilterCards} from "../constants/data/CardConstants.ts";

const CardRow = ({card}: { card: Card | null }) => {
    const navigate = useNavigate();
    if (card !== null) {
        return (
            <tr>
                <td className={"edit-td-data"}>{card.front}</td>
                <td className={"edit-td-data"}>{card.back}</td>
                <td className={"edit-td-data"}>
                    <a className={"link-pointer"} onClick={() => navigate("/card/view", {state: {card}})}>View</a> |
                    <a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {card}})}>Edit</a> |
                    <a className={"link-pointer"} onClick={() => navigate("/card/delete", {state: {card}})}>Delete</a>
                </td>
            </tr>
        );
    }
    else {
        return (
            <tr>
                <td className={"edit-td-data"}><input type={"text"} name={"deckName"}/></td>
                <td className={"edit-td-data"}><input type={"text"} name={"deckDescription"}/></td>
            </tr>
        );
    }
}

const CardTable = ({cards}: { cards: Card[] }) => {
    return (
        <table className="table">
            <thead>
            <tr>
                <td className={"table-column-header"}>Front</td>
                <td className={"table-column-header"}>Back</td>
                {cards.length > 0 && cards[0].id > 0 && <td className={"table-column-header"}>Actions</td>}
            </tr>
            </thead>
            <tbody>
            {cards?.map((card: Card) => (
                <CardRow key={card.front} card={card}/>
            ))}
            <CardRow key={"<new>"} card={null}/>
            </tbody>
        </table>
    );
}

const EditDeck = () => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [searchText, setSearchText] = useState('');
    const { state } = useLocation();
    let deck = state?.deck as Deck;
    const filteredCards = FilterCards(deck?.cards, selectedTags, searchText);
    if (deck === null) {
        deck = {
            id: 0,
            name: 'New Deck',
            description: '',
            cards: []
        }
    }
    const filteredDecks = [deck];

    return (
        <div>
            <UserProfileWidget />
            <HomeWidget/>
            <h2>Ai Forgot These Cards!</h2>
            <br/>
            <br/>
            {deck.id === 0 ? <h3>Create Deck</h3> : <h3>Deck: {deck?.cards[0].deck?.name}</h3>}
            <br/>
            {deck.id > 0 && <SearchAndFilterWidget searchText={searchText} setSearchText={setSearchText} selectedTags={selectedTags} setSelectedTags={setSelectedTags}/>}
            <br/>
            <DeckInfoTable decks={filteredDecks}/>
            <br/>

            {deck.id > 0 && <CardTable cards={filteredCards}/>}
            <button onClick={() => console.log("Cancel")}>Cancel</button>
            <button onClick={() => console.log("Save")}>Save</button>
        </div>
    );
}

export default EditDeck;