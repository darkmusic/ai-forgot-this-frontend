import {Deck} from "../constants/data/data.ts";
import {useNavigate} from "react-router-dom";

const DeckRow = ({deck}: { deck: Deck | null }) => {
    const navigate = useNavigate();

    return (
        <tr>
            {deck === null ? <td className={"edit-td-header"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: null}})}>{"<new>"}</a></td> :
                <td className={"edit-td-header deck-name"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: deck}})}>{deck.name}</a></td>}
            {deck === null ? <td className={"edit-td-header"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: null}})}>{"<new>"}</a></td> :
                <td className={"edit-td-header deck-description"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: deck}})}>{deck.description}</a></td>}
            {deck === null ? <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: null}})}>Create...</a></td> :
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: deck}})}>View/Edit</a></td>}
        </tr>
    );
}

const DeckInfoTable = ({decks}: { decks: Deck[] }) => {
    return (
        <table className="table">
            <thead>
            <tr>
                <td>Deck Name</td>
                <td>Description</td>
                <td>Actions</td>
            </tr>
            </thead>
            <tbody>
            {decks.map((deck) => (
                <DeckRow key={deck.name} deck={deck}/>
            ))}
            <DeckRow key={"<new>"} deck={null}/>
            </tbody>
        </table>
    );
}

export default DeckInfoTable;