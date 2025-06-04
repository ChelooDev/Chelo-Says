import React from "react";
import { useAuth } from "../AuthContext";

export default function HighScores() {
  const { user, highScores } = useAuth();

  if (!user) return null;

  return (
    <div className="high-scores">
      <h2>High Scores</h2>
      <div className="scores-grid">
        <div className="score-item">
          <span>Easy</span>
          <span>{highScores.easy}</span>
        </div>
        <div className="score-item">
          <span>Medium</span>
          <span>{highScores.medium}</span>
        </div>
        <div className="score-item">
          <span>Hard</span>
          <span>{highScores.hard}</span>
        </div>
      </div>
    </div>
  );
}
