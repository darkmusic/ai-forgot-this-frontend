import '../../../css/themes.css'
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import {useLocation, useNavigate} from "react-router-dom";
import {Card, Deck, Tag} from "../../../constants/data/data.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {ChangeEvent, FormEvent, useEffect, useMemo, useState, useRef} from "react";
import DeckWidget from "../Shared/DeckWidget.tsx";
import {useCurrentUser} from "../../Shared/Authentication.ts";
import {deleteOk, postJson, putJson, apiFetch, getJson} from "../../../lib/api";
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
    const COPY_FEEDBACK_DURATION = 1200; // milliseconds
    // Track copied feedback timeout to avoid leaks
    const copyTimeoutRef = useRef<number | null>(null);

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

    // Clear any pending copy feedback timeout on unmount
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current !== null) {
                clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = null;
            }
        };
    }, []);

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
            .then(async () => {
                try {
                    const updatedDeck = await getJson<Deck>(`/api/deck/${deck.id}`);
                    navigate("/deck/edit", {state: {deck: updatedDeck}});
                } catch (error) {
                    console.error("Failed to fetch updated deck:", error);
                    // Fallback: navigate with stale deck or back to home
                    alert("Card saved but failed to refresh deck. Returning to home to refresh deck.");
                    navigate("/home");
                }
            })
            .catch((error) => {
                console.error("Failed to save card:", error);
                alert("Failed to save card. Please try again.");
            });
    }

    const handleAiQuestionAsk = () => {
        const aiQuestion = formData.ai_question;

        if (!aiQuestion) {
            alert("Please enter a question.");
            return;
        }

        setAiLoading(true);
        // Send the AI question to the server (streaming supported)
        apiFetch('/api/ai/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: aiQuestion, userId: user.id })
        }).then(async (response) => {
            if (!response.ok) {
                let detail = "";
                try {
                    const ct = response.headers.get("content-type") || "";
                    if (ct.includes("application/json")) {
                        const errJson = await response.json().catch(() => null);
                        const msg = errJson?.error || errJson?.message || errJson?.detail;
                        if (msg) detail = ` - ${String(msg).slice(0, 500)}`;
                    } else {
                        const txt = await response.text().catch(() => "");
                        if (txt) detail = ` - ${txt.slice(0, 500)}`;
                    }
                } catch {
                    // ignore parsing errors
                }
                alert(`AI request failed: HTTP ${response.status} ${response.statusText}${detail}`);
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
        }).catch((err: unknown) => {
            let msg = "Unknown error";
            const offline = typeof navigator !== "undefined" && navigator && "onLine" in navigator && !navigator.onLine;
            if (offline) {
                msg = "You appear to be offline. Check your internet connection.";
            } else if (err instanceof DOMException && err.name === "AbortError") {
                msg = "The request was cancelled.";
            } else if (err instanceof TypeError) {
                // Fetch typically throws TypeError on network/CORS issues
                msg = "Network error or CORS issue prevented the request.";
            } else if (err && typeof err === "object" && "message" in err) {
                msg = String((err as any).message);
            }
            alert(`Failed to get AI answer: ${msg}`);
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
        // Reset copied flag after a delay; clear any prior timer first
        if (copyTimeoutRef.current !== null) {
            clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = null;
        }
        copyTimeoutRef.current = window.setTimeout(() => {
            setCopied(false);
            copyTimeoutRef.current = null;
        }, COPY_FEEDBACK_DURATION);
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

                <table className={"edit-card-table"}>
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>
                            <table className={"edit-card-table"}>
                                <tbody>
                                <tr>
                                    <td className={"edit-td-header-top"}>Front:</td>
                                    <td className={"edit-td-data"}><textarea name={"front"}
                                                                             onChange={handleChange}
                                                                             className={"card"}
                                                                             value={formData.front} rows={12}
                                                                             cols={50}/></td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header-top"}>Back:</td>
                                    <td className={"edit-td-data"}><textarea name={"back"}
                                                                             onChange={handleChange}
                                                                             className={"card"}
                                                                             value={formData.back} rows={12}
                                                                             cols={50}/></td>
                                </tr>
                                <tr>
                                    <td className={"edit-td-header"}>Card Tags:</td>
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
                                    <td colSpan={2} className={"table-column-header center"}><h3>AI, help please!</h3></td>
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
                                        {aiLoading ? <span className="ai-thinking">Thinking...</span> : null}
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
                                            <div className="ai-copy-modal-overlay">
                                              <div className="ai-copy-modal">
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