import { useState, useEffect } from "react";
import { SrsStatsResponse } from "../../../constants/data/data.ts";
import { getJson } from "../../../lib/api.ts";
import { Link } from "react-router-dom";

const SrsStatsWidget = () => {
    const [stats, setStats] = useState<SrsStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsData = await getJson<SrsStatsResponse>("/api/srs/stats");
                setStats(statsData);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load SRS stats", err);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !stats) {
        return null; // Don't show anything while loading
    }

    return (
        <div className="srs-stats-widget">
            <h3>Study Progress</h3>
            <div className="srs-stats-grid">
                <div className="srs-stat-item">
                    <div className="srs-stat-value">{stats.dueCards}</div>
                    <div className="srs-stat-label">Due for Review</div>
                </div>
                <div className="srs-stat-item">
                    <div className="srs-stat-value">{stats.newCards}</div>
                    <div className="srs-stat-label">New Cards</div>
                </div>
                <div className="srs-stat-item">
                    <div className="srs-stat-value">{stats.reviewedCards}</div>
                    <div className="srs-stat-label">Reviewed</div>
                </div>
                <div className="srs-stat-item">
                    <div className="srs-stat-value">{stats.totalCards}</div>
                    <div className="srs-stat-label">Total Cards</div>
                </div>
            </div>
            {stats.dueCards > 0 && (
                <Link to="/review" className="srs-review-button">
                    Start Review Session
                </Link>
            )}
        </div>
    );
};

export default SrsStatsWidget;
