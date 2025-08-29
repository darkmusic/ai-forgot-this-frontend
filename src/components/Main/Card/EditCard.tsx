import '../../../css/themes.css'
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation, useNavigate} from "react-router-dom";
import {AiModel, Card, Deck, Tag} from "../../../constants/data/data.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {ChangeEvent, FormEvent, useEffect, useMemo, useState} from "react";
import DeckWidget from "../Shared/DeckWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import {fetchModels} from "../../Shared/AiUtility.ts";
import {TOMCAT_SERVER_URL} from '../../../constants/router/router.tsx';

const EditCard = () => {
    const {state} = useLocation();
    const deck = state?.deck as Deck;
    const [selectedCardTags, setSelectedCardTags] = useState<Tag[]>([]);
    const navigate = useNavigate();
    const [canceling, setCanceling] = useState(false);
    const cancelRoute = () => {
        setCanceling(true);
        const path = '/deck/edit';
        navigate(path, {state: {deck: deck}});
    };
    const [deleting, setDeleting] = useState(false);
    const user = useCurrentUser();
    const [aiModels, setAiModels] = useState([] as AiModel[]);
    const [fetchedAiModels, setFetchedAiModels] = useState(false);
    const [formData, setFormData] = useState({
        front: '',
        back: '',
        tags: [] as Tag[],
        ai_question: '',
        ai_answer: '',
        ai_model: '',
    });

    // Get card from state or create a new one if null
    const card : Card = useMemo(
        () : Card => state?.card || {
            id: 0,
            front: '',
            back: '',
            tags: [] as Tag[],
            deck: deck,
        },
        [state, deck]
    )

    // Initialize form data when card is available
    useEffect(() => {
        if (card) {
            setFormData({
                front: card.front || '',
                back: card.back || '',
                tags: card.tags || [] as Tag[],
                ai_question: '',
                ai_answer: '',
                ai_model: '',
            });
            setSelectedCardTags(card.tags || []);
        }
    }, [card]);

    if (!user) {
        return <div>Loading user profile...</div>
    }
    if (!fetchedAiModels) {
        fetchModels().then((models) => setAiModels(models))
            .then(() => setFetchedAiModels(true));
    }
    if (aiModels === null || aiModels.length === 0) {
        return <div>Loading models...</div>
    }
    if (deck === null || deck.id === 0) {
        return <div>Loading deck...</div>
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        if (card === null) {
            setDeleting(false);
            return;
        }
        // Show confirmation message
        if (!confirm(`Are you sure you want to delete card ${card.id}?`)) {
            setDeleting(false);
            return;
        }

        fetch(TOMCAT_SERVER_URL + `/api/card/${card.id}`, {
            method: "DELETE"
        }).then((response) => {
            if (response.ok) {
                setDeleting(false);
                navigate("/deck/edit", {state: {deck: deck}});
            } else {
                setDeleting(false);
                alert("Failed to delete user");
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

        // Validate card data
        if (!formData.front || !formData.back) {
            alert("Front and back of the card cannot be empty.");
            return;
        }

        // Build the card object
        const cardData : Card = {
            id: card?.id || null,
            front: formData.front,
            back: formData.back,
            tags: selectedCardTags,
            deck: deck,
        }

        // Send the card object to the server
        fetch(card.id === 0 ? TOMCAT_SERVER_URL + "/api/card" : TOMCAT_SERVER_URL + `/api/card/${card.id}`, {
            method: card.id === 0 ? "POST" : "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cardData)
        }).then((response) => {
            if (response.ok) {
                alert("Successfully updated card");
                navigate("/deck/edit", {state: {deck: deck}});
            } else {
                alert("Failed to save card");
            }
        });
    }

    const handleAiQuestionAsk = () => {
        const aiModel = formData.ai_model;
        const aiQuestion = formData.ai_question;

        if (!aiModel || !aiQuestion) {
            alert("Please select an AI model and enter a question.");
            return;
        }

        // Send the AI question to the server
        fetch(TOMCAT_SERVER_URL + `/api/ai/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: aiModel,
                question: aiQuestion,
                userId: user.id
            })
        }).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    setFormData({
                        ...formData,
                        ai_answer: data.answer
                    });
                });
            } else {
                alert("Failed to get AI answer");
            }
        });
    }

    return (
        <div>
            <DeckWidget/>
            <UserProfileWidget user={user}/>
            {card.id === 0 ? <h2>Create Card</h2> : <h2>Edit Card</h2>}
            <form onSubmit={handleSubmit}>

                <table className={"table"}>
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>
                            <table className={"table"}>
                                <tbody>
                                <tr>
                                    <td className={"edit-td-header-top"}>Card Front (Markdown supported):</td>
                                    <td className={"edit-td-data"}><textarea name={"front"}
                                                                             onChange={handleChange}
                                                                             className={"card"}
                                                                             value={formData.front} rows={12}
                                                                             cols={50}/></td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header-top"}>Card Back (Markdown supported):</td>
                                    <td className={"edit-td-data"}><textarea name={"back"}
                                                                             onChange={handleChange}
                                                                             className={"card"}
                                                                             value={formData.back} rows={12}
                                                                             cols={50}/></td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header"}>Deck Tags:</td>
                                    <td className={"edit-td-data"}>
                                        <TagWidget onTagsChange={setSelectedCardTags} initialTags={card?.tags}/>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                        <td className={"edit-td-data"}>
                            <table className={"ai-table"}>
                                <thead>
                                <tr>
                                    <td colSpan={2} className={"table-column-header center"}><h3>AI, help
                                        please!</h3></td>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td className={"edit-td-header-ai"}>Model:</td>
                                    <td className={"edit-td-data-ai"}>
                                        <select name={"ai_model"} className={"ai-select"} onChange={handleChange} value={formData.ai_model}>
                                            {aiModels.map((model) => (
                                                <option value={model.model}
                                                        className={"ai-option"}>{model.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header-top-ai"}>Question:</td>
                                    <td className={"edit-td-data-ai"}><textarea name={"ai_question"} rows={6}
                                                                                cols={50}
                                                                                className={"ai-textarea"}
                                                                                onChange={handleChange}
                                                                                value={formData.ai_question}/></td>
                                </tr>
                                <tr>
                                    <td className={"center"} colSpan={2}>
                                        <button type={"button"} onClick={handleAiQuestionAsk} className={"ai-ask-button"}>Ask</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header-top-ai"}>Answer:</td>
                                    <td className={"edit-td-data-ai"}><textarea name={"ai_answer"} rows={15}
                                                                                cols={50}
                                                                                className={"ai-textarea"}
                                                                                readOnly={true}
                                                                                onChange={handleChange}
                                                                                value={formData.ai_answer}/></td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>

            {card.id !== null ? <button type={"button"} onClick={handleDelete}>Delete Card</button> : ""}
            <button onClick={cancelRoute}>Cancel</button>
            <button type={"submit"}>{card.id !== null ? "Save" : "Add"}</button>
            </form>
        </div>
    );
}
export default EditCard;