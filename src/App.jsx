import React from "react";
import padsData from "./pads";
import Pad from "./Pad";
import { useAuth } from "./AuthContext.jsx";
import { updateHighScore, getHighScores } from "./firebase.js";
import HighScores from "./components/HighScores";

const LEVELS = {
  EASY: "easy",

  MEDIUM: "medium",

  HARD: "hard",
};

const SETUP_STAGES = {
  DIFFICULTY: "difficulty",
  SPEED: "speed",
};

export default function App() {
  const { user, login, logout, highScores, setHighScores } = useAuth();

  const [difficulty, setDifficulty] = React.useState(LEVELS.MEDIUM);
  const [setupStage, setSetupStage] = React.useState(SETUP_STAGES.DIFFICULTY);

  const [pads, setPads] = React.useState(padsData);

  const [sequence, setSequence] = React.useState([]);

  const [userStep, setUserStep] = React.useState(0);

  const [gameOver, setGameOver] = React.useState(false);

  const [gameStarted, setGameStarted] = React.useState(false);

  const [isShowingSequence, setIsShowingSequence] = React.useState(false);

  const [userInput, setUserInput] = React.useState([]);

  const [speed, setSpeed] = React.useState(null);

  const cancelRef = React.useRef(false);

  const [showStartScreen, setShowStartScreen] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      getHighScores(user.uid).then((scores) => {
        setHighScores(scores);
      });
    }
  }, [user, setHighScores]);

  React.useEffect(() => {
    switch (difficulty) {
      case LEVELS.EASY:
        setPads(padsData.slice(0, 4));

        break;

      case LEVELS.MEDIUM:
        setPads(padsData.slice(0, 9));

        break;

      case LEVELS.HARD:
        setPads(padsData);

        break;

      default:
        setPads(padsData);
    }
  }, [difficulty]);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function generateRandomPad() {
    const randomIndex = Math.floor(Math.random() * pads.length);
    return pads[randomIndex].id;
  }

  async function showSequence(seq) {
    const sequenceDelay =
      speed === "fast" ? 150 : speed === "normal" ? 250 : 350;

    setIsShowingSequence(true);

    for (let id of seq) {
      if (cancelRef.current) break;

      setPads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, on: true } : item))
      );

      await delay(sequenceDelay);

      if (cancelRef.current) break;

      setPads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, on: false } : item))
      );

      await delay(sequenceDelay);
    }

    setIsShowingSequence(false);
  }

  async function startGame() {
    const initialPad = generateRandomPad();
    const newSequence = [initialPad];
    setGameStarted(true);
    cancelRef.current = true;
    await delay(50);
    cancelRef.current = false;
    setSequence(newSequence);
    setUserStep(0);
    setGameOver(false);
    setUserInput([]);
    await delay(250);
    await showSequence(newSequence);
  }

  async function handleGameOver(finalScore) {
    setGameOver(true);
    if (user) {
      const wasHighScore = await updateHighScore(
        user.uid,
        difficulty,
        finalScore
      );
      if (wasHighScore) {
        const newScores = await getHighScores(user.uid);
        setHighScores(newScores);
      }
    }
  }

  async function handleUserClick(id) {
    if (!gameStarted || gameOver || isShowingSequence) return;

    setUserInput((prev) => [...prev, pads.find((p) => p.id === id)]);

    setPads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, on: true } : item))
    );
    await delay(100);
    setPads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, on: false } : item))
    );

    const isCorrect = id === sequence[userStep];
    const isOnLastStep = userStep === sequence.length - 1;

    if (!isCorrect) {
      handleGameOver(sequence.length - 1);
      return;
    }

    if (isCorrect && isOnLastStep) {
      const nextPad = generateRandomPad();
      const newSequence = [...sequence, nextPad];
      setUserStep(0);
      setSequence(newSequence);
      await delay(250);
      setUserInput([]);
      await delay(500);
      await showSequence(newSequence);
    } else {
      setUserStep((prev) => prev + 1);
    }
  }

  const buttonElements = pads.map((padProperties) => (
    <Pad
      key={padProperties.id}
      color={padProperties.color}
      id={padProperties.id}
      on={padProperties.on}
      toggle={() => handleUserClick(padProperties.id)}
    />
  ));

  function changeDifficulty(level) {
    cancelRef.current = true;
    setDifficulty(level);
  }

  function handleContinue() {
    setSetupStage(SETUP_STAGES.SPEED);
  }

  function handleAdvanceToMain() {
    setShowStartScreen(false);
  }

  function resetGame() {
    setGameStarted(false);
    setGameOver(false);
    setSpeed(null);
    setSetupStage(SETUP_STAGES.DIFFICULTY);
    setDifficulty(LEVELS.MEDIUM);
    setSequence([]);
    setUserStep(0);
    setUserInput([]);
  }

  return (
    <>
      <div className="auth-buttons">
        {user ? (
          <button
            className="auth-button"
            onClick={logout}
            disabled={gameStarted}
            title={gameStarted ? "Cannot sign out during gameplay" : "Sign Out"}
          >
            Sign Out
          </button>
        ) : (
          <button
            className="auth-button"
            onClick={login}
            disabled={gameStarted}
            title={
              gameStarted
                ? "Cannot sign in during gameplay"
                : "Sign in with Google"
            }
          >
            Sign in
          </button>
        )}
      </div>
      <HighScores />
      {showStartScreen ? (
        <div className="start-screen">
          <h1>Welcome to Chelo Says!</h1>
          <p>Let's see if you can make Chelo proud.</p>
          <button className="start-button" onClick={handleAdvanceToMain}>
            Start Game
          </button>
        </div>
      ) : (
        <>
          <header>
            {!gameStarted && (
              <div className="controls">
                {setupStage === SETUP_STAGES.DIFFICULTY && (
                  <>
                    <button
                      className={`easyButton control-button ${
                        difficulty === LEVELS.EASY ? "active" : ""
                      }`}
                      onClick={() => changeDifficulty(LEVELS.EASY)}
                    >
                      Easy
                    </button>
                    <button
                      className={`mediumButton control-button ${
                        difficulty === LEVELS.MEDIUM ? "active" : ""
                      }`}
                      onClick={() => changeDifficulty(LEVELS.MEDIUM)}
                    >
                      Medium
                    </button>
                    <button
                      className={`hardButton control-button ${
                        difficulty === LEVELS.HARD ? "active" : ""
                      }`}
                      onClick={() => changeDifficulty(LEVELS.HARD)}
                    >
                      Hard
                    </button>
                    <button
                      className="continueButton control-button"
                      onClick={handleContinue}
                      disabled={!difficulty}
                    >
                      Continue
                    </button>
                  </>
                )}
                {setupStage === SETUP_STAGES.SPEED && (
                  <>
                    <button
                      className={`slowButton control-button ${
                        speed === "slow" ? "active" : ""
                      }`}
                      onClick={() => setSpeed("slow")}
                    >
                      🐢 Slow
                    </button>
                    <button
                      className={`normalButton control-button ${
                        speed === "normal" ? "active" : ""
                      }`}
                      onClick={() => setSpeed("normal")}
                    >
                      ⚡ Normal
                    </button>
                    <button
                      className={`fastButton control-button ${
                        speed === "fast" ? "active" : ""
                      }`}
                      onClick={() => setSpeed("fast")}
                    >
                      Fast 🚀
                    </button>
                    <button
                      className="startButton control-button"
                      onClick={startGame}
                      disabled={!speed}
                    >
                      Go
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="status-bar">
              {gameOver ? (
                <div className="after-game">
                  <button
                    className="game-over control-button"
                    disabled={true}
                  >{`Game Over!`}</button>
                  <button
                    className="play-again control-button"
                    onClick={resetGame}
                  >
                    {`Score: ${sequence.length - 1}`}
                    <br />
                    Play again?
                  </button>
                </div>
              ) : gameStarted ? (
                <div className="level-indicator control-button">{`Level: ${sequence.length}`}</div>
              ) : null}
            </div>
          </header>
          <main>
            <div className="game-area">
              <div className="grid-wrap">
                <div
                  className={`${difficulty} ${
                    isShowingSequence ? "disabled" : ""
                  }`}
                >
                  {buttonElements}
                </div>
              </div>
              {!gameOver && gameStarted && (
                <div className="user-sequence">
                  {sequence.map((_, index) => (
                    <div
                      key={index}
                      className="user-sequence-item"
                      style={{
                        backgroundColor: userInput[index]
                          ? userInput[index].color
                          : "#555",
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}
    </>
  );
}
