import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { useState, useEffect, useMemo, useCallback } from "react";
import { SrsCardResponse, Tag } from "../../../constants/data/data.ts";
import { getJson, postJson } from "../../../lib/api.ts";
import Markdown from "../../Shared/Markdown.tsx";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";
import { useLocation } from "react-router-dom";
import TagWidget, { TagMatchMode } from "../Shared/TagWidget.tsx";
import TagCloud, { TagCloudEntry } from "../Shared/TagCloud.tsx";
import { shuffleArray } from "../../../lib/shuffle.ts";

const Review = () => {
  const user = useCurrentUser();
  const [reviewQueue, setReviewQueue] = useState<SrsCardResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>("OR");
  const [tagWidgetKey, setTagWidgetKey] = useState(0);
  const { state } = useLocation();
  const deckFromState: { id?: number | null; name?: string } | undefined = state?.deck;
  const deckId = deckFromState?.id ?? null;

  const fetchReviewQueue = useCallback(
    async (opts?: { shuffle?: boolean }) => {
      try {
        setLoading(true);
        const url = deckId
          ? `/api/srs/review-queue?deckId=${deckId}`
          : "/api/srs/review-queue";
        const queue = await getJson<SrsCardResponse[]>(url);
        setReviewQueue(opts?.shuffle ? shuffleArray(queue) : queue);
        setCurrentIndex(0);
        setShowAnswer(false);
        setLoading(false);
      } catch (err) {
        console.error("Error loading review queue:", err);
        setError(
          `Failed to load review queue: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    },
    [deckId]
  );

  // Fetch the review queue on component mount
  useEffect(() => {
    void fetchReviewQueue();
  }, [fetchReviewQueue]);

  const availableTags = useMemo<Tag[]>(() => {
    const byId = new Map<number, Tag>();
    for (const item of reviewQueue) {
      for (const tag of item.card.tags ?? []) {
        if (tag.id == null) continue;
        byId.set(tag.id, tag);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [reviewQueue]);

  const tagCloudEntries = useMemo<TagCloudEntry[]>(() => {
    const byId = new Map<number, TagCloudEntry>();
    for (const item of reviewQueue) {
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
  }, [reviewQueue]);

  const toggleSelectedTag = (tag: Tag) => {
    if (tag.id == null) return;
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.id === tag.id);
      if (exists) return prev.filter((t) => t.id !== tag.id);
      return [...prev, tag];
    });
  };

  const filteredQueue = useMemo<SrsCardResponse[]>(() => {
    if (selectedTags.length === 0) return reviewQueue;

    const selectedIds = selectedTags
      .map((t) => t.id)
      .filter((id): id is number => id != null);

    if (selectedIds.length === 0) return reviewQueue;

    return reviewQueue.filter((item) => {
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
  }, [reviewQueue, selectedTags, tagMatchMode]);

  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [selectedTags, tagMatchMode]);

  const handleClearFilter = () => {
    setSelectedTags([]);
    setTagWidgetKey((k) => k + 1);
  };

  const handleShuffleDeck = () => {
    void fetchReviewQueue({ shuffle: true });
  };

  const handleReview = async (quality: number) => {
    if (currentIndex >= filteredQueue.length) return;

    const currentCardResponse = filteredQueue[currentIndex];

    try {
      // Submit the review
      await postJson("/api/srs/review", {
        cardId: currentCardResponse.card.id,
        quality: quality,
      });

      // Move to next card
      setShowAnswer(false);
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(
        `Failed to submit review: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
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
          <p>Loading review queue...</p>
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
        </div>
      </div>
    );
  }

  if (reviewQueue.length === 0) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <h2>Review</h2>
          <p>No cards due for review! Great job! 🎉</p>
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
            {deckId
              ? `Review - Deck: ${deckFromState?.name || "Unknown Deck"}`
              : "Review - All Due Cards"}
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
                    placeholderText={
                      deckId
                        ? "Type to search tags in this deck..."
                        : "Type to search tags in this review queue..."
                    }
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
                    title={deckId ? "Tags in this deck" : "Tags in this review queue"}
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
          <h2>Review Complete!</h2>
          <p>You've reviewed all {filteredQueue.length} cards. Well done! 🎉</p>
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
          <button onClick={() => window.location.reload()}>Review More</button>
        </div>
      </div>
    );
  }

  const currentCardResponse = filteredQueue[currentIndex];
  const card = currentCardResponse.card;
  const deck = currentCardResponse.deck; // Use deck from response, not card.deck

  return (
    <div>
      <HomeWidget />
      <UserProfileWidget user={user} />
      <div className="quiz-header">
        {deckId ? `Review - Deck: ${deckFromState?.name || deck?.name || "Unknown Deck"}` : "Review - All Due Cards"}
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
                placeholderText={
                  deckId
                    ? "Type to search tags in this deck..."
                    : "Type to search tags in this review queue..."
                }
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
                title={deckId ? "Tags in this deck" : "Tags in this review queue"}
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
        <Markdown>
          {showAnswer
            ? PrepareCardMarkdown(deck?.templateBack || "", card.back)
            : PrepareCardMarkdown(deck?.templateFront || "", card.front)}
        </Markdown>
      </div>
      <br />
      {showAnswer && (
        <div className="review-quality-buttons">
          <button
            className="quiz-button quality-again"
            onClick={() => handleReview(1)}
            title="Completely forgot"
          >
            Again
          </button>
          <button
            className="quiz-button quality-hard"
            onClick={() => handleReview(3)}
            title="Recalled with difficulty"
          >
            Hard
          </button>
          <button
            className="quiz-button quality-good"
            onClick={() => handleReview(4)}
            title="Recalled after brief hesitation"
          >
            Good
          </button>
          <button
            className="quiz-button quality-easy"
            onClick={() => handleReview(5)}
            title="Perfect recall"
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
};

export default Review;
