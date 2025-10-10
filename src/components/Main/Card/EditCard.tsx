import '../../../css/themes.css'
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation, useNavigate} from "react-router-dom";
import {Card, Deck, Tag} from "../../../constants/data/data.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {ChangeEvent, FormEvent, useEffect, useMemo, useState, useRef} from "react";
import DeckWidget from "../Shared/DeckWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import { deleteOk, postJson, putJson, apiFetch } from "../../../lib/api";
import Markdown from "react-markdown";

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
    const [formData, setFormData] = useState({
        front: '',
        back: '',
        tags: [] as Tag[],
        ai_question: '',
        ai_answer: '',
    });
    // Add copied indicator for clipboard action
    const [copied, setCopied] = useState(false);
    // Add loading indicator state for AI request
    const [aiLoading, setAiLoading] = useState(false);
    // Modal fallback for manual copy
    const [showCopyModal, setShowCopyModal] = useState(false);
    const copyTextRef = useRef<HTMLTextAreaElement | null>(null);

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
            });
            setSelectedCardTags(card.tags || []);
        }
    }, [card]);

    useEffect(() => {
        if (showCopyModal && copyTextRef.current) {
            copyTextRef.current.focus();
            copyTextRef.current.select();
        }
    }, [showCopyModal]);

    if (!user) {
        return <div>Loading user profile...</div>
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

        deleteOk(`/api/card/${card.id}`)
            .then((ok) => {
                if (ok) {
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
        const save = card.id === 0
            ? postJson<Card>(`/api/card`, cardData)
            : putJson<Card>(`/api/card/${card.id}`, cardData);
        save
            .then(() => {
                alert("Successfully updated card");
                navigate("/deck/edit", {state: {deck: deck}});
            })
            .catch(() => alert("Failed to save card"));
    }

    const handleAiQuestionAsk = () => {
        const aiQuestion = formData.ai_question;

        if (!aiQuestion) {
            alert("Please enter a question.");
            return;
        }

        setAiLoading(true);
        // Send the AI question to the server (streaming supported)
        apiFetch(`/api/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: aiQuestion, userId: user.id })
        }).then(async (response) => {
            if (!response.ok) {
                alert("Failed to get AI answer");
                return;
            }
            try {
                const data = await response.json();
                setFormData({ ...formData, ai_answer: data.answer });
            } catch {
                // If backend streams line-delimited JSON or text, fallback to text
                const text = await response.text();
                setFormData({ ...formData, ai_answer: text });
            }
        }).catch(() => {
            alert("Failed to get AI answer");
        }).finally(() => {
            setAiLoading(false);
        });
    }
    // Copy raw markdown to clipboard (with fallback)
    const handleCopyAiAnswer = async () => {
        const text = formData.ai_answer || "";
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            // Fallback: open modal with selectable text for manual copy
            setShowCopyModal(true);
        }
        setTimeout(() => setCopied(false), 1200);
    };

    const handleSelectAllCopyModal = () => {
        if (copyTextRef.current) {
            copyTextRef.current.focus();
            copyTextRef.current.select();
        }
    };

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
                                    <td className={"edit-td-header-top-ai"}>Question:</td>
                                    <td className={"edit-td-data-ai"}><textarea name={"ai_question"} rows={6}
                                                                                cols={50}
                                                                                className={"ai-textarea"}
                                                                                onChange={handleChange}
                                                                                value={formData.ai_question}/></td>
                                </tr>
                                <tr>
                                    <td className={"center"} colSpan={2}>
                                        <button
                                            type={"button"}
                                            onClick={handleAiQuestionAsk}
                                            className={"ai-ask-button"}
                                            disabled={aiLoading}
                                        >
                                            {aiLoading ? "Asking..." : "Ask"}
                                        </button>
                                        {aiLoading ? <span style={{ marginLeft: '0.5rem' }}>Thinking...</span> : null}
                                    </td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header-top-ai"}>Answer:</td>
                                    <td className={"edit-td-data-ai"}>
                                        {/* Copy button and status */}
                                        <div className="ai-answer-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <button type="button" onClick={handleCopyAiAnswer}>Copy</button>
                                            {copied ? <span>Copied!</span> : null}
                                        </div>
                                        {/* Render AI answer with Markdown formatting */}
                                        <div className="ai-answer-markdown">
                                            <Markdown>{formData.ai_answer || ""}</Markdown>
                                        </div>
                                        {/* Manual copy modal fallback */}
                                        {showCopyModal ? (
                                            <div
                                              className="ai-copy-modal-overlay"
                                              style={{
                                                position: 'fixed',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 1000
                                              }}
                                            >
                                              <div
                                                className="ai-copy-modal"
                                                style={{
                                                  background: 'var(--background, #fff)',
                                                  color: 'inherit',
                                                  padding: '1rem',
                                                  borderRadius: '6px',
                                                  width: 'min(720px, 90vw)',
                                                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                                }}
                                              >
                                                <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Copy Markdown</h4>
                                                <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                                                  Press Ctrl/Cmd+C to copy the selected text.
                                                </p>
                                                <textarea
                                                  ref={copyTextRef}
                                                  readOnly
                                                  value={formData.ai_answer}
                                                  style={{ width: '100%', height: '240px', fontFamily: 'monospace' }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                  <button type="button" onClick={handleSelectAllCopyModal}>Select All</button>
                                                  <button type="button" onClick={() => setShowCopyModal(false)}>Close</button>
                                                </div>
                                              </div>
                                            </div>
                                        ) : null}
                                    </td>
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