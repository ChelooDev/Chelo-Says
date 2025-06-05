import React, { useState } from "react";

export default function NicknameModal({ onSubmit, canClose = true }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (nickname.length < 3) {
      setError("Nickname must be at least 3 characters");
      return;
    }

    if (nickname.length > 15) {
      setError("Nickname must be less than 15 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(nickname.trim());
    } catch (error) {
      setError(error.message || "Failed to set nickname. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nickname-modal-overlay">
      <div className="nickname-modal">
        <h2>Choose Your Nickname</h2>
        <p>This will be displayed on the leaderboards</p>
        <p className="nickname-warning">
          Note: You cannot change your nickname later!
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            placeholder="Enter nickname"
            maxLength={15}
            className="nickname-input"
            disabled={isSubmitting}
          />
          {error && <div className="nickname-error">{error}</div>}
          <button
            type="submit"
            className="nickname-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting nickname..." : "Set Nickname"}
          </button>
        </form>
      </div>
    </div>
  );
}
