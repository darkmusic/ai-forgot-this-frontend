import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { useState, useEffect } from "react";
import { SrsCardResponse } from "../../../constants/data/data.ts";
import { getJson } from "../../../lib/api.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";
import { useLocation, useNavigate } from "react-router-dom";

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

  const handleNext = () => {
    if (currentIndex < cramQueue.length - 1) {
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

  if (currentIndex >= cramQueue.length) {
    return (
      <div>
        <HomeWidget />
        <UserProfileWidget user={user} />
        <div className="review-container">
          <h2>Cram Session Complete!</h2>
          <p>You've gone through all {cramQueue.length} cards. 🎉</p>
          <button onClick={handleFinish}>Back to Home</button>
        </div>
      </div>
    );
  }

  const currentCardResponse = cramQueue[currentIndex];
  const card = currentCardResponse.card;
  const deckInfo = currentCardResponse.deck;

  return (
    <div>
      <HomeWidget />
      <UserProfileWidget user={user} />
      <div className="quiz-header">
        Cram Session - Deck: {deckInfo?.name || "Unknown Deck"}
      </div>
      <div className="review-progress">
        Card {currentIndex + 1} of {cramQueue.length}
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
        {currentIndex === cramQueue.length - 1 ? (
          <button className="quiz-button" onClick={handleFinish}>
            Finish
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
