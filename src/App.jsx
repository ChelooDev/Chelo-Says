import React from "react";
import padsData from "./pads"; // Assuming padsData is defined elsewhere
import Pad from "./Pad"; // Assuming Pad component is defined elsewhere

const LEVELS = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

export default function App() {
  const [difficulty, setDifficulty] = React.useState(LEVELS.MEDIUM);
  const [pads, setPads] = React.useState(padsData);
  const [sequence, setSequence] = React.useState([]);
  const [userStep, setUserStep] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [isShowingSequence, setIsShowingSequence] = React.useState(false);
  const [userInput, setUserInput] = React.useState([]);
  const [speed, setSpeed] = React.useState(null);
  const cancelRef = React.useRef(false);

  // NEW STATE: to control the visibility of the starting screen
  const [showStartScreen, setShowStartScreen] = React.useState(true);

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

  React.useEffect(() => {
    if (
      gameStarted &&
      !gameOver &&
      !isShowingSequence &&
      userInput.length > 0
    ) {
      const lastClickedPad = userInput[userInput.length - 1];
      const expectedPadId = sequence[userStep];

      if (lastClickedPad.id === expectedPadId) {
        if (userStep === sequence.length - 1) {
          const advanceLevel = async () => {
            await delay(300);

            const nextPad = generateRandomPad();
            const newSequence = [...sequence, nextPad];

            setSequence(newSequence);
            setUserStep(0);
            setUserInput([]);
            await delay(500);
            await showSequence(newSequence);
          };
          advanceLevel();
        } else {
          setUserStep((prev) => prev + 1);
        }
      } else {
        setGameOver(true);
      }
    }
  }, [userInput, userStep, sequence, gameStarted, gameOver, isShowingSequence]);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function generateRandomPad() {
    return pads[Math.floor(Math.random() * pads.length)].id;
  }

  async function showSequence(seq) {
    const sequenceDelay = speed === "fast" ? 200 : 350;
    setIsShowingSequence(true);
    await delay(sequenceDelay);

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

    await delay(1000);

    await showSequence(newSequence);
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
  }

  function playAgain() {
    setGameOver(false);
    setGameStarted(false);
    setSequence([]);
    setUserStep(0);
    setUserInput([]);
    setSpeed(null);
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
    setSequence([]);
    setUserStep(0);
    setGameOver(false);
    setGameStarted(false);
    setUserInput([]);
    setSpeed(null);
  }

  function handleAdvanceToMain() {
    setShowStartScreen(false);
  }

  return (
    <>
      {showStartScreen ? (
        <div className="start-screen">
          <h1>Welcome to Chelo Says!</h1>
          <p>Let's see if you can make Chelo happy.</p>
          <button className="start-button" onClick={handleAdvanceToMain}>
            Start Game
          </button>
        </div>
      ) : (
        <>
          <header>
            {!gameStarted && (
              <div className="controls">
                <button
                  className="easyButton control-button"
                  onClick={() => changeDifficulty(LEVELS.EASY)}
                >
                  Easy
                </button>
                <button
                  className="mediumButton control-button"
                  onClick={() => changeDifficulty(LEVELS.MEDIUM)}
                >
                  Medium
                </button>
                <button
                  className="hardButton control-button"
                  onClick={() => changeDifficulty(LEVELS.HARD)}
                >
                  Hard
                </button>
                <div className="speedAndStart">
                  <button
                    className="startButton control-button"
                    onClick={startGame}
                    disabled={!speed}
                  >
                    Start Game
                  </button>
                  <div>
                    <div>
                      <div
                        className="speed-toggle control-button"
                        onClick={() =>
                          setSpeed((prev) =>
                            prev === "fast" ? "slow" : "fast"
                          )
                        }
                      >
                        <span
                          className={speed === "slow" ? "active-speed" : ""}
                        >
                          🐢 Slow
                        </span>
                        <span
                          className={speed === "fast" ? "active-speed" : ""}
                        >
                          Fast 🚀
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                    onClick={playAgain}
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
