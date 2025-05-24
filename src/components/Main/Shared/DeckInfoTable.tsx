import {Deck} from "../../../constants/data/data.ts";
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
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/quiz", {state: {deck: deck}})}>Quiz!</a> | <a className={"link-pointer"} onClick={() => navigate("/deck/edit", {state: {deck: deck}})}>View/Edit</a> | <a className={"link-pointer"} onClick={() => navigate("/deck/delete", {state: {deck: deck}})}>Delete</a></td>}
        </tr>
    );
}

const DeckInfoTable = ({decks}: { decks: Deck[] }) => {
    return (
        <table className="table">
            <thead>
            <tr>
                <td className="table-header">Deck Name</td>
                <td className="table-header">Description</td>
                <td className="table-header">Actions</td>
            </tr>
            </thead>
            <tbody>
            <DeckRow key={"<new>"} deck={null}/>
            {decks.map((deck) => (
                <DeckRow key={deck.name} deck={deck}/>
            ))}
            </tbody>
        </table>
    );
}

export default DeckInfoTable;