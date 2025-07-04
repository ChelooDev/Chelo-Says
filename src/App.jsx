import React from "react";
import padsData from "./pads";
import Pad from "./Pad";
import { useAuth } from "./AuthContext.jsx";
import {
  updateHighScore,
  signInWithGoogle,
  getLeaderboard,
  initializeLeaderboards,
  checkNicknameExists,
  setUserNickname,
} from "./firebase.js";
import HighScores from "./components/HighScores";
import Leaderboard from "./components/Leaderboard";
import NicknameModal from "./components/NicknameModal";
import { LEVELS, SETUP_STAGES } from "./constants";

export default function App() {
  const { user, login, logout, highScores, setHighScores } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = React.useState(false);
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [hasNickname, setHasNickname] = React.useState(false);
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

  // Detect mobile device (simple width check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const [showStartScreen, setShowStartScreen] = React.useState(() => {
    if (isMobile) return false;
    return !user;
  });

  React.useEffect(() => {
    initializeLeaderboards().catch(console.error);
  }, []);

  React.useEffect(() => {
    if (user) {
      setShowStartScreen(false);
    }
  }, [user]);

  React.useEffect(() => {
    async function checkNickname() {
      if (user) {
        const nickExists = await checkNicknameExists(user.uid);
        setHasNickname(nickExists);
        if (!nickExists) {
          setShowNicknameModal(true);
        }
      } else {
        setHasNickname(false);
        setShowNicknameModal(false);
      }
    }
    checkNickname();
  }, [user]);

  React.useEffect(() => {
    if (user) {
      getLeaderboard("easy").then((easyScores) => {
        getLeaderboard("medium").then((mediumScores) => {
          getLeaderboard("hard").then((hardScores) => {
            const userScores = {
              easy:
                easyScores.find((entry) => entry.userId === user.uid)?.score ||
                0,
              medium:
                mediumScores.find((entry) => entry.userId === user.uid)
                  ?.score || 0,
              hard:
                hardScores.find((entry) => entry.userId === user.uid)?.score ||
                0,
            };
            setHighScores(userScores);
          });
        });
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
      console.log(
        "Game over with score:",
        finalScore,
        "difficulty:",
        difficulty
      );
      const wasHighScore = await updateHighScore(
        user.uid,
        difficulty,
        finalScore
      );
      console.log("Was high score:", wasHighScore);
      if (wasHighScore) {
        try {
          const [easyScores, mediumScores, hardScores] = await Promise.all([
            getLeaderboard("easy"),
            getLeaderboard("medium"),
            getLeaderboard("hard"),
          ]);

          const userScores = {
            easy:
              easyScores.find((entry) => entry.userId === user.uid)?.score || 0,
            medium:
              mediumScores.find((entry) => entry.userId === user.uid)?.score ||
              0,
            hard:
              hardScores.find((entry) => entry.userId === user.uid)?.score || 0,
          };
          console.log("Updated user scores:", userScores);
          setHighScores(userScores);
        } catch (error) {
          console.error("Error updating high scores:", error);
        }
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

      // Check if current score beats high score and update in real-time
      if (user) {
        const currentScore = newSequence.length - 1;
        const currentHighScore = highScores[difficulty.toLowerCase()] || 0;

        if (currentScore > currentHighScore) {
          setHighScores((prev) => ({
            ...prev,
            [difficulty.toLowerCase()]: currentScore,
          }));

          updateHighScore(user.uid, difficulty, currentScore).catch((error) => {
            console.error("Error updating high score:", error);
            setHighScores((prev) => ({
              ...prev,
              [difficulty.toLowerCase()]: currentHighScore,
            }));
          });
        }
      }

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
    console.log("Changing difficulty to:", level);
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

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleNicknameSubmit = async (nickname) => {
    try {
      if (!user) throw new Error("No user logged in");
      await setUserNickname(user.uid, nickname);
      setHasNickname(true);
      setShowNicknameModal(false);
    } catch (error) {
      console.error("Error setting nickname:", error);
      if (error.message === "Nickname already set") {
        setShowNicknameModal(false);
        setHasNickname(true);
      }
    }
  };

  // Disable game controls if nickname not set
  const isGameDisabled = user && !hasNickname;

  return (
    <>
      {!showStartScreen && (
        <div className="auth-buttons">
          {!isMobile && (
            user ? (
              <>
                <button
                  className="auth-button"
                  onClick={logout}
                  disabled={gameStarted}
                  title={
                    gameStarted
                      ? "Cannot sign out during gameplay"
                      : "Sign Out"
                  }
                >
                  Sign Out
                </button>
                <button
                  className="leaderboard-button control-button"
                  onClick={() => setShowLeaderboard(true)}
                  disabled={gameStarted}
                >
                  Leaderboards
                </button>
              </>
            ) : (
              <>
                <button
                  className="auth-button"
                  onClick={handleLogin}
                  disabled={gameStarted}
                  title={
                    gameStarted
                      ? "Cannot sign in during gameplay"
                      : "Sign in with Google"
                  }
                >
                  Sign in with Google
                </button>
              </>
            )
          )}
        </div>
      )}

      {!isMobile && <HighScores />}

      {showNicknameModal && (
        <NicknameModal onSubmit={handleNicknameSubmit} canClose={false} />
      )}

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {showStartScreen ? (
        <div className="start-screen">
          <h1>Welcome to Chelo Says!</h1>
          <p>Let's see if you can make Chelo proud.</p>
          {user ? (
            <button
              className="auth-button"
              onClick={logout}
              disabled={gameStarted}
              title={
                gameStarted ? "Cannot sign out during gameplay" : "Sign Out"
              }
            >
              Sign Out
            </button>
          ) : (
            <button
              className="auth-button"
              onClick={handleLogin}
              disabled={gameStarted}
              title={
                gameStarted
                  ? "Cannot sign in during gameplay"
                  : "Sign in with Google"
              }
            >
              Sign in with Google
            </button>
          )}
          {user && hasNickname && (
            <button
              className="leaderboard-button control-button"
              onClick={() => setShowLeaderboard(true)}
              disabled={gameStarted}
            >
              Leaderboards
            </button>
          )}
          <button
            className="start-button"
            onClick={handleAdvanceToMain}
            disabled={isGameDisabled}
          >
            {isGameDisabled ? "Set nickname to play" : "Start Game"}
          </button>
        </div>
      ) : (
        <>
          <header>
            <div className="controls">
              {(!gameStarted && setupStage === SETUP_STAGES.DIFFICULTY) && (
                <>
                  <button
                    className={`easyButton control-button ${
                      difficulty === LEVELS.EASY ? "active" : ""
                    }`}
                    onClick={() => changeDifficulty(LEVELS.EASY)}
                    disabled={isGameDisabled}
                  >
                    Easy
                  </button>
                  <button
                    className={`mediumButton control-button ${
                      difficulty === LEVELS.MEDIUM ? "active" : ""
                    }`}
                    onClick={() => changeDifficulty(LEVELS.MEDIUM)}
                    disabled={isGameDisabled}
                  >
                    Medium
                  </button>
                  <button
                    className={`hardButton control-button ${
                      difficulty === LEVELS.HARD ? "active" : ""
                    }`}
                    onClick={() => changeDifficulty(LEVELS.HARD)}
                    disabled={isGameDisabled}
                  >
                    Hard
                  </button>
                  <button
                    className="continueButton control-button"
                    onClick={handleContinue}
                    disabled={isGameDisabled}
                  >
                    Continue
                  </button>
                </>
              )}
              {(!gameStarted && setupStage === SETUP_STAGES.SPEED) && (
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
              {(gameStarted || gameOver) && (
                <>
                  {gameOver ? (
                    <button className="game-over control-button" onClick={resetGame}>{`Game Over! Score: ${sequence.length - 1}`}</button>
                  ) : (
                    <button className="level-indicator control-button" disabled>{`Level ${sequence.length}`}</button>
                  )}
                </>
              )}
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