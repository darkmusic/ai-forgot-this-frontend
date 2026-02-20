import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Deck, Tag } from "../../../constants/data/data.ts";
import TagWidget from "../Shared/TagWidget.tsx";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import DeckWidget from "../Shared/DeckWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import {
  deleteOk,
  postJson,
  putJson,
  apiFetch,
  getJson,
} from "../../../lib/api";
import Markdown from "../../Shared/Markdown.tsx";

const EditCard = () => {
  const { state } = useLocation();
  const deck = (state?.deck as Deck | undefined) ??
    ((state?.card as Card | undefined)?.deck as Deck | undefined);
  const [selectedCardTags, setSelectedCardTags] = useState<Tag[]>([]);
  const navigate = useNavigate();
  const [canceling, setCanceling] = useState(false);
  const cancelRoute = () => {
    setCanceling(true);
    if (deck) {
      const path = "/deck/edit";
      navigate(path, { state: { deck: deck } });
    } else {
      navigate("/home");
    }
  };
  const [deleting, setDeleting] = useState(false);
  const user = useCurrentUser();
  const [formData, setFormData] = useState({
    front: "",
    back: "",
    tags: [] as Tag[],
    ai_question: "",
    ai_answer: "",
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
  const card: Card = useMemo(
    (): Card =>
      state?.card || {
        id: 0,
        front: "",
        back: "",
        tags: [] as Tag[],
        deck: deck,
      },
    [state, deck]
  );

  // Initialize form data when card is available
  useEffect(() => {
    if (card) {
      void Promise.resolve().then(() => {
        setFormData({
          front: card.front || "",
          back: card.back || "",
          tags: card.tags || ([] as Tag[]),
          ai_question: "",
          ai_answer: "",
        });
        setSelectedCardTags(card.tags || []);
      });
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
    return <div>Loading user profile...</div>;
  }

  if (!deck || deck.id == null || deck.id === 0) {
    return (
      <div>
        <DeckWidget />
        <UserProfileWidget user={user} />
        <h2>Edit Card</h2>
        <p>
          Missing deck context (this page requires navigation from a deck).
        </p>
        <button type="button" onClick={() => navigate("/home")}>Return Home</button>
      </div>
    );
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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

    deleteOk(`/api/card/${card.id}`).then((ok) => {
      if (ok) {
        setDeleting(false);
        navigate("/deck/edit", { state: { deck: deck } });
      } else {
        setDeleting(false);
        alert("Failed to delete user");
      }
    });
  };

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
    const cardData: Card = {
      id: card?.id || null,
      front: formData.front,
      back: formData.back,
      tags: selectedCardTags,
      deck: deck,
    };

    // Send the card object to the server
    const save =
      card.id === 0
        ? postJson<Card>(`/api/card`, cardData)
        : putJson<Card>(`/api/card/${card.id}`, cardData);
    save
      .then(async () => {
        try {
          const updatedDeck = await getJson<Deck>(`/api/deck/${deck.id}`);
          navigate("/deck/edit", { state: { deck: updatedDeck } });
        } catch (error) {
          console.error("Failed to fetch updated deck:", error);
          // Fallback: navigate with stale deck or back to home
          alert(
            "Card saved but failed to refresh deck. Returning to home to refresh deck."
          );
          navigate("/home");
        }
      })
      .catch((error) => {
        console.error("Failed to save card:", error);
        alert("Failed to save card. Please try again.");
      });
  };

  const handleAiQuestionAsk = () => {
    const aiQuestion = formData.ai_question;

    if (!aiQuestion) {
      alert("Please enter a question.");
      return;
    }

    // Client-side safety timeout: slightly longer than the server-side AI client timeout
    // so the server has a chance to respond with a clean HTTP error before the browser aborts.
    // The server-side timeout is controlled by AI_CLIENT_READ_TIMEOUT (default 10 min).
    const AI_CLIENT_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort("AI request timed out on the client side."),
      AI_CLIENT_TIMEOUT_MS
    );

    setAiLoading(true);
    // Send the AI question to the server. The response is Server-Sent Events (SSE):
    // the server sends an immediate heartbeat comment so the browser's TTFB timer never
    // fires, then a "done" event with the full answer when inference completes.
    apiFetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: aiQuestion, userId: user.id }),
      signal: controller.signal,
    })
      .then(async (response) => {
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
          alert(
            `AI request failed: HTTP ${response.status} ${response.statusText}${detail}`
          );
          return;
        }

        // Read the SSE stream. Each SSE event is a block of lines terminated by a
        // blank line (\n\n). We look for two named events:
        //   event: done   — carries the full AI answer in data lines
        //   event: error  — carries an error message in data lines
        // All other events (heartbeat comments etc.) are silently ignored.
        if (!response.body) {
          alert("AI response body is unavailable.");
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let aiAnswer: string | null = null;
        try {
          outer: while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // Walk through every complete SSE event in the buffer.
            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const rawEvent = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);

              // Parse SSE fields from the raw event block.
              let eventName = "message";
              const dataLines: string[] = [];
              for (const line of rawEvent.split("\n")) {
                if (line.startsWith("event:")) {
                  eventName = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                  // Strip the single optional leading space required by the SSE spec.
                  dataLines.push(line.slice(5).replace(/^ /, ""));
                }
                // Lines starting with ':' are heartbeat comments; ignore them.
              }

              if (eventName === "done" && dataLines.length > 0) {
                aiAnswer = dataLines.join("\n");
                break outer;
              } else if (eventName === "error" && dataLines.length > 0) {
                throw new Error(dataLines.join("\n"));
              }

              boundary = buffer.indexOf("\n\n");
            }
          }
        } finally {
          reader.releaseLock();
        }
        if (aiAnswer !== null) {
          setFormData((prev) => ({ ...prev, ai_answer: aiAnswer! }));
        }
      })
      .catch((err: unknown) => {
        // Always log the raw error so dev tools show the real cause.
        console.error("AI fetch error:", err);
        let msg = "Unknown error";
        const offline =
          typeof navigator !== "undefined" &&
          navigator &&
          "onLine" in navigator &&
          !navigator.onLine;
        if (controller.signal.aborted) {
          // Check the signal first — browsers (especially Firefox) may throw a
          // plain TypeError instead of a DOMException(AbortError) when the signal
          // fires, so inspecting the signal directly is the only reliable approach.
          const reason = controller.signal.reason;
          msg = typeof reason === "string"
            ? reason
            : "The request was cancelled.";
        } else if (offline) {
          msg = "You appear to be offline. Check your internet connection.";
        } else if (err instanceof DOMException && err.name === "AbortError") {
          // Fallback: some browsers DO throw DOMException(AbortError) for aborts
          // not triggered by our controller (e.g. navigation away from the page).
          msg = "The request was cancelled.";
        } else if (err instanceof TypeError) {
          // fetch() throws TypeError for network-level failures:
          // connection reset, refused, DNS failure, etc. — NOT always CORS.
          const detail = err.message ? `: ${err.message}` : "";
          msg = `Network or connection error${detail}. Check the server/browser console for details.`;
        } else if (err && typeof err === "object" && "message" in err) {
          const maybeMessage = (err as { message?: unknown }).message;
          if (typeof maybeMessage === "string") {
            msg = maybeMessage;
          }
        }
        alert(`Failed to get AI answer: ${msg}`);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        setAiLoading(false);
      });
  };
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
      <DeckWidget />
      <UserProfileWidget user={user} />
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
                      <td className={"edit-td-data"}>
                        <textarea
                          name={"front"}
                          onChange={handleChange}
                          className={"card"}
                          value={formData.front}
                          rows={12}
                          cols={50}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={"edit-td-header-top"}>Back:</td>
                      <td className={"edit-td-data"}>
                        <textarea
                          name={"back"}
                          onChange={handleChange}
                          className={"card"}
                          value={formData.back}
                          rows={12}
                          cols={50}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={"edit-td-header"}>Card Tags:</td>
                      <td className={"edit-td-data"}>
                        <TagWidget
                          onTagsChange={setSelectedCardTags}
                          selectedTags={selectedCardTags}
                          initialTags={card?.tags}
                          suggestionScope="cards"
                          resultCount={selectedCardTags.length}
                          resultCountLabel="Tags"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className={"edit-td-data"}>
                <table className={"ai-table"}>
                  <thead>
                    <tr>
                      <td colSpan={2} className={"table-column-header center"}>
                        <h3>AI, help please!</h3>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={"edit-td-header-top-ai"}>Question:</td>
                      <td className={"edit-td-data-ai"}>
                        <textarea
                          name={"ai_question"}
                          rows={6}
                          cols={50}
                          className={"ai-textarea"}
                          onChange={handleChange}
                          value={formData.ai_question}
                        />
                      </td>
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
                        {aiLoading ? (
                          <span className="ai-thinking">Thinking...</span>
                        ) : null}
                      </td>
                    </tr>
                    <tr>
                      <td className={"edit-td-header-top-ai"}>Answer:</td>
                      <td className={"edit-td-data-ai"}>
                        {/* Copy button and status */}
                        <div
                          className="ai-answer-actions"
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <button type="button" onClick={handleCopyAiAnswer}>
                            Copy
                          </button>
                          {copied ? <span>Copied!</span> : null}
                        </div>
                        {/* Render AI answer with Markdown formatting */}
                        <div className="ai-answer-markdown">
                          <Markdown>
                            {formData.ai_answer || ""}
                          </Markdown>
                        </div>
                        {/* Manual copy modal fallback */}
                        {showCopyModal ? (
                          <div className="ai-copy-modal-overlay">
                            <div className="ai-copy-modal">
                              <h4
                                style={{ marginTop: 0, marginBottom: "0.5rem" }}
                              >
                                Copy Markdown
                              </h4>
                              <p
                                style={{ marginTop: 0, marginBottom: "0.5rem" }}
                              >
                                Press Ctrl/Cmd+C to copy the selected text.
                              </p>
                              <textarea
                                ref={copyTextRef}
                                readOnly
                                value={formData.ai_answer}
                                style={{
                                  width: "100%",
                                  height: "240px",
                                  fontFamily: "monospace",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  justifyContent: "flex-end",
                                  marginTop: "0.5rem",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={handleSelectAllCopyModal}
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowCopyModal(false)}
                                >
                                  Close
                                </button>
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

        {card.id !== null ? (
          <button type={"button"} onClick={handleDelete}>
            Delete Card
          </button>
        ) : (
          ""
        )}
        <button onClick={cancelRoute}>Cancel</button>
        <button type={"submit"}>{card.id !== null ? "Save" : "Add"}</button>
      </form>
    </div>
  );
};
export default EditCard;
