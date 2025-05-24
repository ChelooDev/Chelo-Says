import React from "react"
import padsData from "./pads"
import Pad from "./Pad"

const LEVELS = {
    EASY: "easy",
    MEDIUM: "medium",
    HARD: "hard"
}

export default function App() {
    const [difficulty, setDifficulty] = React.useState(LEVELS.MEDIUM)
    const [pads, setPads] = React.useState(padsData)
    const [sequence, setSequence] = React.useState([])  
    const [userStep, setUserStep] = React.useState(0)   
    const [gameOver, setGameOver] = React.useState(false)
    const [gameStarted, setGameStarted] = React.useState(false)
    const [isShowingSequence, setIsShowingSequence] = React.useState(false)
    const [userInput, setUserInput] = React.useState([])
    const [speed, setSpeed] = React.useState(null)
    const cancelRef = React.useRef(false)

    React.useEffect(() => {
        switch (difficulty) {
            case LEVELS.EASY:
                setPads(padsData.slice(0, 4))
                break
            case LEVELS.MEDIUM:
                setPads(padsData.slice(0, 9))
                break
            case LEVELS.HARD:
                setPads(padsData)
                break
            default:
                setPads(padsData)
        }
    }, [difficulty])

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    function generateRandomPad() {
        return pads[Math.floor(Math.random() * pads.length)].id
    }

    async function showSequence(seq) {
        const sequenceDelay = speed === "fast" ? 200 : 500; 
        setIsShowingSequence(true);
        await delay(sequenceDelay);

        for (let id of seq) {
            if (cancelRef.current) break;

            setPads(prev => prev.map(item =>
                item.id === id ? { ...item, on: true } : item
            ));
            await delay(sequenceDelay);

            if (cancelRef.current) break;

            setPads(prev => prev.map(item =>
                item.id === id ? { ...item, on: false } : item
            ));
            await delay(sequenceDelay);
        }

        setIsShowingSequence(false);
    }

    async function startGame() {

        setGameStarted(true)
        cancelRef.current = true
        await delay(50)
        cancelRef.current = false

        const initialPad = generateRandomPad()
        const newSequence = [initialPad]

        setSequence(newSequence)
        setUserStep(0)
        setGameOver(false)
        setUserInput([])

        await showSequence(newSequence)
    }

    async function handleUserClick(id) {
        if (!gameStarted || gameOver || isShowingSequence) return;

        setUserInput(prev => [...prev, pads.find(p => p.id === id)]);

        setPads(prev => prev.map(item =>
            item.id === id ? { ...item, on: true } : item
        ));

        await delay(200);

        setPads(prev => prev.map(item =>
            item.id === id ? { ...item, on: false } : item
        ));

        const isCorrect = id === sequence[userStep];
        const isOnLastStep = userStep === sequence.length - 1;

        if (isCorrect) {
            if (isOnLastStep) {
                await delay(300);

                const nextPad = generateRandomPad();
                const newSequence = [...sequence, nextPad];

                setSequence(newSequence);
                setUserStep(0);
                setUserInput([]);
                await delay(500);
                await showSequence(newSequence);

                setUserInput([]);
            } else {
                setUserStep(prev => prev + 1);
            }
        } else {
            setGameOver(true);
        }
    }

    const buttonElements = pads.map(variableX => (
        <Pad 
            key={variableX.id}
            color={variableX.color}
            id={variableX.id}
            on={variableX.on}
            toggle={() => handleUserClick(variableX.id)}
        />
    ))

    function changeDifficulty(level) {
        cancelRef.current = true
        setDifficulty(level)
        setSequence([])
        setUserStep(0)
        setGameOver(false)
        setGameStarted(false)
        setUserInput([])
        setSpeed(null)
    }

    return (
       <>
        <header className="controls">
            <button className="easyButton control-button" onClick={() => changeDifficulty(LEVELS.EASY)}>Easy</button>
            <button className="mediumButton control-button" onClick={() => changeDifficulty(LEVELS.MEDIUM)}>Medium</button>
            <button className="hardButton control-button" onClick={() => changeDifficulty(LEVELS.HARD)}>Hard</button>
        </header>

        <main>
            <div className="game-area">   
                <div className="status-bar">
    {gameOver ? (
        <div className="control-button">Game Over!</div>
    ) : gameStarted ? (
        <div className="control-button">{`Level: ${sequence.length}`}</div>
    ) : undefined 
    }

    {(!gameStarted || gameOver) && (
        <div className="speed-box">
            <div className="speed-toggle" onClick={() => setSpeed(prev => prev === "fast" ? "slow" : "fast")}>
                <span className={speed === "slow" ? "active-speed" : ""}>🐢 Slow</span>
                <span className={speed === "fast" ? "active-speed" : ""}>🚀 Fast</span>
            </div>
        </div>
    )}
</div>

                <div className={`${difficulty} ${isShowingSequence ? "disabled" : ""}`}>
                    {buttonElements}
                </div>
                <div className="user-sequence">
                    {sequence.map((_, index) => (
                        <div 
                            key={index}
                            className="user-sequence-item"
                            style={{
                                backgroundColor: userInput[index] ? userInput[index].color : "#555"
                            }}
                        ></div>
                        
                    ))}
                </div> 
                    {(!gameStarted && speed) && (
                        <button 
                            className="startButton control-button" 
                            onClick={startGame}
                        >
                            Start Game
                        </button>
                    )}
            </div>
        </main>
    </>
    )
}
