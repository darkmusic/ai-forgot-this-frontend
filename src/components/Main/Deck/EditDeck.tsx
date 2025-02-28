import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import {Card, Deck, Tag} from "../../../constants/data/data.ts";
import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import HomeWidget from "../Shared/HomeWidget.tsx";
import {FilterCards} from "../../../constants/data/CardConstants.ts";
import TagWidget from "../Shared/TagWidget.tsx";

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
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {card}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {card}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {card}})}>Create</a></td>
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
            <CardRow key={"<new>"} card={null}/>
            {cards?.map((card: Card) => (
                <CardRow key={card.front} card={card}/>
            ))}
            </tbody>
        </table>
    );
}

const EditDeck = () => {
    const [selectedCardTags, setSelectedCardTags] = useState<Tag[]>([]);
    const [, setSelectedDeckTags] = useState<Tag[]>([]);
    const [searchText, setSearchText] = useState('');
    const { state } = useLocation();
    const navigate = useNavigate();

    let deck = state?.deck as Deck;
    const filteredCards = FilterCards(deck?.cards, selectedCardTags, searchText);
    if (deck === null) {
        deck = {
            id: 0,
            name: 'New Deck',
            description: '',
            cards: [],
            tags: []
        }
    }

    return (
        <div>
            <UserProfileWidget />
            <HomeWidget/>
            <h2>Ai Forgot These Cards!</h2>
            <br/>
            <br/>
            {deck.id === 0 ? <h3>Create Deck</h3> : <h3>Deck: {deck?.cards[0].deck?.name}</h3>}
            <br/>
            <table className={"table"}>
                <tbody>
                <tr>
                    <td className={"edit-td-header"}>Deck Name:</td>
                    <td className={"edit-td-data"}><input name={"deckName"} defaultValue={deck.name}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Description:</td>
                    <td className={"edit-td-data"}><input name={"deckDescription"} defaultValue={deck.description}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Tags:</td>
                    <td className={"edit-td-data"}>
                        <TagWidget onTagsChange={setSelectedDeckTags} initialTags={deck.tags}/>
                    </td>
                </tr>
                </tbody>
            </table>
            <button onClick={() => navigate('/home')}>Cancel</button>
            <button onClick={() => navigate('/home')}>Save</button>

            <br/>
            <br/>
            {deck.id > 0 && <h3>Cards</h3>}
            {deck.id > 0 && <SearchAndFilterWidget searchText={searchText} setSearchText={setSearchText} selectedTags={selectedCardTags} setSelectedTags={setSelectedCardTags}/>}
            <br/>

            {deck.id > 0 && <CardTable cards={filteredCards}/>}
        </div>
    );
}

export default EditDeck;