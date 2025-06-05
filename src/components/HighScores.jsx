import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { getUserData } from "../firebase";

export default function HighScores() {
  const { user, highScores } = useAuth();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    async function fetchNickname() {
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData?.nickname) {
          setNickname(userData.nickname);
        }
      }
    }
    fetchNickname();
  }, [user]);

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
      {nickname && (
        <div className="nickname-display">
          <span className="nickname-label">Player:</span>
          <span className="nickname-value" title={nickname}>
            {nickname}
          </span>
        </div>
      )}
    </div>
  );
}
