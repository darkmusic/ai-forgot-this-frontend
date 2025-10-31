import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { useState, useEffect } from "react";
import { SrsCardResponse } from "../../../constants/data/data.ts";
import { getJson, postJson } from "../../../lib/api.ts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";

const Review = () => {
    const user = useCurrentUser();
    const [reviewQueue, setReviewQueue] = useState<SrsCardResponse[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch the review queue on component mount
    useEffect(() => {
        const fetchReviewQueue = async () => {
            try {
                setLoading(true);
                const queue = await getJson<SrsCardResponse[]>("/api/srs/review-queue");
                setReviewQueue(queue);
                setLoading(false);
            } catch (err) {
                console.error("Error loading review queue:", err);
                setError(`Failed to load review queue: ${err instanceof Error ? err.message : String(err)}`);
                setLoading(false);
            }
        };

        fetchReviewQueue();
    }, []);

    const handleReview = async (quality: number) => {
        if (currentIndex >= reviewQueue.length) return;

        const currentCardResponse = reviewQueue[currentIndex];

        try {
            // Submit the review
            await postJson("/api/srs/review", {
                cardId: currentCardResponse.card.id,
                quality: quality
            });

            // Move to next card
            setShowAnswer(false);
            setCurrentIndex(currentIndex + 1);
        } catch (err) {
            console.error("Error submitting review:", err);
            setError(`Failed to submit review: ${err instanceof Error ? err.message : String(err)}`);
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

    if (currentIndex >= reviewQueue.length) {
        return (
            <div>
                <HomeWidget />
                <UserProfileWidget user={user} />
                <div className="review-container">
                    <h2>Review Complete!</h2>
                    <p>You've reviewed all {reviewQueue.length} cards. Well done! 🎉</p>
                    <button onClick={() => window.location.reload()}>Review More</button>
                </div>
            </div>
        );
    }

    const currentCardResponse = reviewQueue[currentIndex];
    const card = currentCardResponse.card;
    const deck = currentCardResponse.deck;  // Use deck from response, not card.deck

    return (
        <div>
            <HomeWidget />
            <UserProfileWidget user={user} />
            <div className="quiz-header">
                Review - Deck: {deck?.name || "Unknown Deck"}
            </div>
            <div className="review-progress">
                Card {currentIndex + 1} of {reviewQueue.length}
                {currentCardResponse.isNew && <span className="new-badge"> (NEW)</span>}
            </div>
            <br/>
            <div className="quiz-card" onClick={() => setShowAnswer(!showAnswer)}>
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {showAnswer
                        ? PrepareCardMarkdown(deck?.templateBack || "", card.back)
                        : PrepareCardMarkdown(deck?.templateFront || "", card.front)
                    }
                </ReactMarkdown>
            </div>
            <br/>
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
