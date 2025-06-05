import React, { useState, useEffect } from "react";
import { getLeaderboard } from "../firebase";
import { LEVELS } from "../constants";

export default function Leaderboard({ onClose }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(LEVELS.EASY);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(selectedDifficulty);
        setLeaderboardData(data);
      } catch (error) {}
      setLoading(false);
    };

    fetchLeaderboard();
  }, [selectedDifficulty]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Leaderboard</h2>

        <div className="difficulty-selector">
          {Object.values(LEVELS).map((level) => (
            <button
              key={level}
              className={`difficulty-button ${
                selectedDifficulty === level ? "active" : ""
              }`}
              onClick={() => setSelectedDifficulty(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="rank">#</div>
              <div className="nickname">Player</div>
              <div className="score">Score</div>
              <div className="date">Date</div>
            </div>
            {leaderboardData && leaderboardData.length > 0 ? (
              leaderboardData.map((entry, index) => (
                <div key={`${entry.userId}-${index}`} className="table-row">
                  <div className="rank">{index + 1}</div>
                  <div className="nickname">{entry.nickname}</div>
                  <div className="score">{entry.score}</div>
                  <div className="date">{formatDate(entry.achievedAt)}</div>
                </div>
              ))
            ) : (
              <div className="no-entries">No entries yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
