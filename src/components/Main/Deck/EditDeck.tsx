import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import {Card, Deck, Tag} from "../../../constants/data/data.ts";
import {ChangeEvent, FormEvent, useMemo, useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import HomeWidget from "../Shared/HomeWidget.tsx";
import {FilterCards} from "../../Shared/CardUtility.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {getAuthHeader, useCurrentUser} from "../../Shared/Authentication.ts";

const CardRow = ({props}: {props: { card: Card | null, deck: Deck}}) => {
    const navigate = useNavigate();
    if (props.card !== null) {
        return (
            <tr>
                <td className={"edit-td-data"}>{props.card.front}</td>
                <td className={"edit-td-data"}>{props.card.back}</td>
                <td className={"edit-td-data"}>
                    <a className={"link-pointer"} onClick={() => navigate("/card/view", {state: {deck: props.deck, card: props.card}})}>View</a> |
                    <a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck: props.deck, card: props.card}})}>Edit</a> |
                    <a className={"link-pointer"} onClick={() => navigate("/card/delete", {state: {deck: props.deck, card: props.card}})}>Delete</a>
                </td>
            </tr>
        );
    }
    else {
        return (
            <tr>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck: props.deck, card: null}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck: props.deck, card: null}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck: props.deck, card: null}})}>Create</a></td>
            </tr>
        );
    }
}

const CardTable = ({props}: { props: {cards: Card[], deck: Deck }}) => {
    return (
        <table className="table">
            <thead>
            <tr>
                <td className={"table-column-header"}>Front</td>
                <td className={"table-column-header"}>Back</td>
                {props.cards !== null && <td className={"table-column-header"}>Actions</td>}
            </tr>
            </thead>
            <tbody>
            <CardRow key={"<new>"} props={{card:null, deck:props.deck}}/>
            {props.cards?.map((card: Card) => (
                <CardRow key={card.front} props={{card:card, deck:props.deck as Deck}}/>
            ))}
            </tbody>
        </table>
    );
}

const EditDeck = () => {
    const [selectedCardTags, setSelectedCardTags] = useState<Tag[]>([]);
    const [selectedDeckTags, setSelectedDeckTags] = useState<Tag[]>([]);
    const [searchText, setSearchText] = useState('');
    const { state } = useLocation();
    const navigate = useNavigate();
    const user = useCurrentUser();
    const [canceling, setCanceling] = useState(false);
    const cancelRoute = () => {
        setCanceling(true);
        const path = '/home';
        navigate(path);
    };
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        deckName: '',
        deckDescription: '',
        deckTags: [] as Tag[],
    });

    // Get deck from state or create a new one if null
    const deck : Deck = useMemo(
        () : Deck => state?.deck || {
            id: 0,
            name: 'New Deck',
            description: '',
            cards: [],
            tags: [],
            user: user
        },
        [state, user]
    );

    // Initialize form data when deck is available
    useEffect(() => {
        if (deck) {
            setFormData({
                deckName: deck.name || '',
                deckDescription: deck.description || '',
                deckTags: deck.tags || [],
            });
            setSelectedDeckTags(deck.tags || []);
        }
    }, [deck]);

    if (!user) {
        return <div>Loading user profile...</div>
    }
    else {
        // This isn't loaded by default, so we need to set it here
        deck.user = user;
    }

    const filteredCards = FilterCards(deck?.cards, selectedCardTags, searchText);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        if (deck === null) {
            setDeleting(false);
            return;
        }
        // Show confirmation message
        if (!confirm(`Are you sure you want to delete deck ${deck.id}?`)) {
            setDeleting(false);
            return;
        }

        fetch(`/api/deck/${deck.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": getAuthHeader(user)
            }
        }).then((response) => {
            if (response.ok) {
                setDeleting(false);
                navigate("/home");
            } else {
                setDeleting(false);
                alert("Failed to delete deck");
            }
        });
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (deleting) return;
        if (canceling) return;

        if (user === null) {
            alert("User is not logged in");
            return;
        }

        // Validate deck data
        if (!formData.deckName) {
            alert("Deck name cannot be empty.");
            return;
        }

        // Build the deck object
        const deckData : Deck = {
            id: deck?.id || null,
            name: formData.deckName,
            description: formData.deckDescription,
            tags: selectedDeckTags,
            cards: deck?.cards || [],
            user: user
        };

        // Send the deck object to the server
        fetch(deck.id === 0 ? "/api/deck" : `/api/deck/${deck.id}`, {
            method: deck.id === 0 ? "POST" : "PUT",
            headers: {
                "Authorization": getAuthHeader(user),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(deckData)
        }).then((response) => {
            if (response.ok) {
                navigate("/home");
            } else {
                alert("Failed to save deck");
            }
        });
    }


    return (
        <div>
            <UserProfileWidget user={user} />
            <HomeWidget/>
            <h2>Ai Forgot These Cards!</h2>
            <br/>
            <br/>
            {deck.id === 0 ? <h3>Create Deck</h3> : <h3>Deck: {deck?.name}</h3>}
            <br/>
            <form onSubmit={handleSubmit}>
            <table className={"table"}>
                <tbody>
                <tr>
                    <td className={"edit-td-header"}>Deck Name:</td>
                    <td className={"edit-td-data"}><input name={"deckName"} onChange={handleChange} value={formData.deckName}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Description:</td>
                    <td className={"edit-td-data"}><input name={"deckDescription"} onChange={handleChange} value={formData.deckDescription}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Tags:</td>
                    <td className={"edit-td-data"}>
                        <TagWidget onTagsChange={setSelectedDeckTags} initialTags={formData.deckTags}/>
                    </td>
                </tr>
                </tbody>
            </table>
            <button type={"submit"}>{deck.id !== null ? "Save" : "Add"}</button>
            <button type={"button"} onClick={cancelRoute}>Cancel</button>
            {deck.id !== null && deck.id > 0 ? <button type="button" onClick={handleDelete}>Delete Deck</button> : ""}
            </form>
            <br/>
            <br/>
            {deck.id !== null && deck.id > 0 && <h3>Cards</h3>}
            {deck.id !== null && deck.id > 0 && <SearchAndFilterWidget searchText={searchText} setSearchText={setSearchText} selectedTags={selectedCardTags} setSelectedTags={setSelectedCardTags}/>}
            <br/>

            {deck.id !== null && deck.id > 0 && <CardTable props={{cards:filteredCards, deck:deck}}/>}
        </div>
    );
}

export default EditDeck;