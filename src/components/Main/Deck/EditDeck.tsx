import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import {Card, Deck, Tag} from "../../../constants/data/data.ts";
import {ChangeEvent, FormEvent, useMemo, useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import HomeWidget from "../Shared/HomeWidget.tsx";
import {FilterCards} from "../../Shared/CardUtility.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import { deleteOk, postJson, putJson } from "../../../lib/api";

const CardTable = (p: { cards: Card[], deck: Deck }) => {
    const { cards, deck } = p;
    const navigate = useNavigate();
    return (
        <table className="table">
            <thead>
            <tr>
                <td className={"table-column-header"}>Front</td>
                <td className={"table-column-header"}>Back</td>
                {cards !== null && <td className={"table-column-header"}>Actions</td>}
            </tr>
            </thead>
            <tbody>
            <tr key={"<new>"}>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck, card: null}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck, card: null}})}>{"<new>"}</a></td>
                <td className={"edit-td-data"}><a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck, card: null}})}>Create</a></td>
            </tr>
            {cards?.map((c: Card) => (
                <tr key={c.front}>
                    <td className={"edit-td-data"}>{c.front}</td>
                    <td className={"edit-td-data"}>{c.back}</td>
                    <td className={"edit-td-data"}>
                        <a className={"link-pointer"} onClick={() => navigate("/card/view", {state: {deck, card: c}})}>View</a> |
                        <a className={"link-pointer"} onClick={() => navigate("/card/edit", {state: {deck, card: c}})}>Edit</a> |
                        <a className={"link-pointer"} onClick={() => navigate("/card/delete", {state: {deck, card: c}})}>Delete</a>
                    </td>
                </tr>
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
        templateFront: '',
        templateBack: ''
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
                templateFront: deck.templateFront || '',
                templateBack: deck.templateBack || ''
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

        deleteOk(`/api/deck/${deck.id}`)
            .then((ok) => {
                if (ok) {
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
            user: user,
            templateFront: formData.templateFront || '',
            templateBack: formData.templateBack || ''
        };

        // Send the deck object to the server
        const save = deck.id === 0
            ? postJson<Deck>(`/api/deck`, deckData)
            : putJson<Deck>(`/api/deck/${deck.id}`, deckData);
        save
            .then(() => navigate("/home"));
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
                    <td className={"edit-td-data"}><input name={"deckName"} onChange={handleChange} value={formData.deckName} size={50}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Description:</td>
                    <td className={"edit-td-data"}><input name={"deckDescription"} onChange={handleChange} value={formData.deckDescription} size={50}/></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Template Front:</td>
                    <td className={"edit-td-data"}>
                        <textarea
                            name="templateFront"
                            onChange={handleChange}
                            value={formData.templateFront || ""}
                            rows={3}
                            cols={50}
                        />
                    </td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Template Back:</td>
                    <td className={"edit-td-data"}>
                        <textarea
                            name="templateBack"
                            onChange={handleChange}
                            value={formData.templateBack || ""}
                            rows={3}
                            cols={50}
                        />
                    </td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Deck Tags:</td>
                    <td className={"edit-td-data"}>
                        <TagWidget onTagsChange={setSelectedDeckTags} initialTags={formData.deckTags} allowCreation={true}/>
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

            {deck.id !== null && deck.id > 0 && <CardTable cards={filteredCards} deck={deck}/>}
        </div>
    );
}

export default EditDeck;