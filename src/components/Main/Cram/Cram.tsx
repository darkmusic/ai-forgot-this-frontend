import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { useState, useEffect, useMemo } from "react";
import { SrsCardResponse, Tag } from "../../../constants/data/data.ts";
import { getJson } from "../../../lib/api.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";
import { useLocation, useNavigate } from "react-router-dom";
import TagWidget, { TagMatchMode } from "../Shared/TagWidget.tsx";
import TagCloud, { TagCloudEntry } from "../Shared/TagCloud.tsx";
import { shuffleArray } from "../../../lib/shuffle.ts";

const Cram = () => {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const deck = location.state?.deck;

  const [cramQueue, setCramQueue] = useState<SrsCardResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>("OR");
  const [tagWidgetKey, setTagWidgetKey] = useState(0);

  // Fetch the cram queue on component mount
  useEffect(() => {
    if (!deck?.id) {
      setError("No deck selected for cramming.");
      setLoading(false);
      return;
    }

    const fetchCramQueue = async () => {
      try {
        setLoading(true);
        const queue = await getJson<SrsCardResponse[]>(
          `/api/srs/cram-queue?deckId=${deck.id}`
        );
        setCramQueue(queue);
        setCurrentIndex(0);
        setShowAnswer(false);
        setLoading(false);
      } catch (err) {
        console.error("Error loading cram queue:", err);
        setError(
          `Failed to load cram queue: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    };

    fetchCramQueue();
  }, [deck?.id]);

  const availableTags = useMemo<Tag[]>(() => {
    const byId = new Map<number, Tag>();
    for (const item of cramQueue) {
      for (const tag of item.card.tags ?? []) {
        if (tag.id == null) continue;
        byId.set(tag.id, tag);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [cramQueue]);

  const tagCloudEntries = useMemo<TagCloudEntry[]>(() => {
    const byId = new Map<number, TagCloudEntry>();
    for (const item of cramQueue) {
      for (const tag of item.card.tags ?? []) {
        if (tag.id == null) continue;
        const existing = byId.get(tag.id);
        if (existing) {
          existing.count += 1;
        } else {
          byId.set(tag.id, { tag, count: 1 });
        }
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const diff = b.count - a.count;
      if (diff !== 0) return diff;
      return (a.tag.name || "").localeCompare(b.tag.name || "");
    });
  }, [cramQueue]);

  const toggleSelectedTag = (tag: Tag) => {
    if (tag.id == null) return;
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.id === tag.id);
      if (exists) return prev.filter((t) => t.id !== tag.id);
      return [...prev, tag];
    });
  };

  const filteredQueue = useMemo<SrsCardResponse[]>(() => {
    if (selectedTags.length === 0) return cramQueue;

    const selectedIds = selectedTags
      .map((t) => t.id)
      .filter((id): id is number => id != null);

    if (selectedIds.length === 0) return cramQueue;

    return cramQueue.filter((item) => {
      const cardTagIds = new Set(
        (item.card.tags ?? [])
          .map((t) => t.id)
          .filter((id): id is number => id != null)
      );

      if (tagMatchMode === "AND") {
        return selectedIds.every((id) => cardTagIds.has(id));
      }
      return selectedIds.some((id) => cardTagIds.has(id));
    });
  }, [cramQueue, selectedTags, tagMatchMode]);

  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [selectedTags, tagMatchMode]);

  const handleNext = () => {
    if (currentIndex < filteredQueue.length - 1) {
      setShowAnswer(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    navigate("/home");
  };

  const handleCompleteSession = () => {
    setShowAnswer(false);
    setCurrentIndex(filteredQueue.length);
  };

  const handleClearFilter = () => {
    setSelectedTags([]);
    setTagWidgetKey((k) => k + 1);
  };

  const handleShuffleDeck = () => {
    setCramQueue((prev) => shuffleArray(prev));
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  if (loading) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <p>Loading cram session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <p className="error">{error}</p>
          <button onClick={handleFinish}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (cramQueue.length === 0) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <h2>Cram Session</h2>
          <p>No cards found in this deck.</p>
          <button onClick={handleFinish}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (filteredQueue.length === 0) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <div className="quiz-header">
            Cram Session - Deck: {deck?.name || "Unknown Deck"}
          </div>
          <br />
          <table className={"table"}>
            <thead>
              <tr>
                <td className="table-header">Filter by tag(s)</td>
                <td className="table-header">Actions</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <TagWidget
                    key={tagWidgetKey}
                    onTagsChange={setSelectedTags}
                    selectedTags={selectedTags}
                    initialTags={[]}
                    allowCreation={false}
                    availableTags={availableTags}
                    resultCount={filteredQueue.length}
                    placeholderText="Type to search tags in this deck..."
                    showMatchModeToggle={true}
                    matchMode={tagMatchMode}
                    onMatchModeChange={setTagMatchMode}
                  />
                </td>
                <td>
                  <button
                    className="quiz-button"
                    onClick={handleClearFilter}
                    disabled={selectedTags.length === 0}
                  >
                    Clear Filter
                  </button>
                  <button
                    className="quiz-button"
                    onClick={handleShuffleDeck}
                    disabled={filteredQueue.length <= 1}
                  >
                    Shuffle Deck
                  </button>
                  <button className="quiz-button" onClick={handleFinish}>
                    Back to Home
                  </button>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <TagCloud
                    title="Tags in this deck"
                    entries={tagCloudEntries}
                    selectedTagIds={selectedTags
                      .map((t) => t.id)
                      .filter((id): id is number => id != null)}
                    onTagToggle={toggleSelectedTag}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <br />
          <p>No cards match the selected tag filter.</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= filteredQueue.length) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <h2>Cram Session Complete!</h2>
          <p>You've gone through all {filteredQueue.length} cards. 🎉</p>
          <button
            className="quiz-button"
            onClick={handleShuffleDeck}
            disabled={filteredQueue.length <= 1}
          >
            Shuffle Deck
          </button>
          {selectedTags.length > 0 && (
            <button className="quiz-button" onClick={handleClearFilter}>
              Clear Filter
            </button>
          )}
          <button className="quiz-button" onClick={handleFinish}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentCardResponse = filteredQueue[currentIndex];
  const card = currentCardResponse.card;
  const deckInfo = currentCardResponse.deck;

  return (
    <div>
      <HomeWidget />
      <UserProfileWidget user={user} />
      <div className="quiz-header">
        Cram Session - Deck: {deckInfo?.name || "Unknown Deck"}
      </div>
      <table className={"table"}>
        <thead>
          <tr>
            <td className="table-header">Filter by tag(s)</td>
            <td className="table-header">Actions</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <TagWidget
                key={tagWidgetKey}
                onTagsChange={setSelectedTags}
                selectedTags={selectedTags}
                initialTags={[]}
                allowCreation={false}
                availableTags={availableTags}
                resultCount={filteredQueue.length}
                placeholderText="Type to search tags in this deck..."
                showMatchModeToggle={true}
                matchMode={tagMatchMode}
                onMatchModeChange={setTagMatchMode}
              />
            </td>
            <td>
              <button
                className="quiz-button"
                onClick={handleClearFilter}
                disabled={selectedTags.length === 0}
              >
                Clear Filter
              </button>
              <button
                className="quiz-button"
                onClick={handleShuffleDeck}
                disabled={filteredQueue.length <= 1}
              >
                Shuffle Deck
              </button>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <TagCloud
                title="Tags in this deck"
                entries={tagCloudEntries}
                selectedTagIds={selectedTags
                  .map((t) => t.id)
                  .filter((id): id is number => id != null)}
                onTagToggle={toggleSelectedTag}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="review-progress">
        Card {currentIndex + 1} of {filteredQueue.length}
        {currentCardResponse.isNew && <span className="new-badge"> (NEW)</span>}
      </div>
      <br />
      <div className="quiz-card" onClick={() => setShowAnswer(!showAnswer)}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {showAnswer
            ? PrepareCardMarkdown(deckInfo?.templateBack || "", card.back)
            : PrepareCardMarkdown(deckInfo?.templateFront || "", card.front)}
        </ReactMarkdown>
      </div>
      <br />
      <div className="cram-navigation-buttons">
        <button
          className="quiz-button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <button
          className="quiz-button"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? "Show Question" : "Show Answer"}
        </button>
        {currentIndex === filteredQueue.length - 1 ? (
          <button className="quiz-button" onClick={handleCompleteSession}>
            Complete
          </button>
        ) : (
          <button className="quiz-button" onClick={handleNext}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default Cram;
