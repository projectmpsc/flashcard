"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { BookOpen, Brain, Home, ChevronLeft, ChevronRight, Check, X, RefreshCw, Moon, Sun, Shuffle } from "lucide-react"

// Add the type reference directly
type ConfettiOptions = Parameters<typeof confetti>[0]

export default function FlashcardGame() {
  const [mode, setMode] = useState<"home" | "study" | "quiz" | "stats">("home")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [learned, setLearned] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showReaction, setShowReaction] = useState<string | null>(null)
  const [allFlashcards, setAllFlashcards] = useState<{ question: string; answer: string; options?: string[] }[]>([])
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string; options?: string[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([])
  const [cardsPerRound] = useState(Number(process.env.NEXT_PUBLIC_CARDS_PER_ROUND) || 5)
  const [isShuffling, setIsShuffling] = useState(false)

  // Load all flashcards from JSON
  useEffect(() => {
    setLoading(true)
    fetch(process.env.NEXT_PUBLIC_API_URL || "/flashcards.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load flashcards")
        }
        return response.json()
      })
      .then((data) => {
        setAllFlashcards(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error loading flashcards:", error)
        setError("Failed to load flashcards. Please try again later.")
        setLoading(false)
      })
  }, [])

  // Select random flashcards when starting a new game
  const selectRandomFlashcards = useCallback(() => {
    if (allFlashcards.length === 0) return

    setIsShuffling(true)

    // Create a copy of the array to avoid modifying the original
    const shuffled = [...allFlashcards].sort(() => 0.5 - Math.random())

    // Take the first 'cardsPerRound' cards
    const selected = shuffled.slice(0, cardsPerRound)

    setFlashcards(selected)
    setCurrentIndex(0)
    setLearned([])
    setScore(0)
    setAttempts(0)
    setWrongAnswers([])
    setShowStats(false)
    setFlipped(false)
    setSelectedOption(null)
    setShowReaction(null)

    setTimeout(() => {
      setIsShuffling(false)
    }, 800)
  }, [allFlashcards, cardsPerRound])

  // Initialize random flashcards when all flashcards are loaded
  useEffect(() => {
    if (allFlashcards.length > 0) {
      selectRandomFlashcards()
    }
  }, [allFlashcards, selectRandomFlashcards])

  // Apply dark mode to the document body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [darkMode])

  const handleFlip = useCallback(() => {
    if (mode === "quiz" && !selectedOption && !flipped) {
      setShowReaction("⚠️ Select an answer first!")
      // Shake animation effect for the card
      const card = document.querySelector(".card-container")
      card?.classList.add("shake")
      setTimeout(() => {
        card?.classList.remove("shake")
      }, 500)
      return
    }
    setFlipped(!flipped)
    setShowReaction(null)
  }, [mode, selectedOption, flipped])

  const markAsLearned = useCallback(() => {
    if (!learned.includes(currentIndex)) {
      setLearned([...learned, currentIndex])
      // Trigger confetti for marking a card as learned
      triggerConfetti(false)
    }
    nextCard()
  }, [currentIndex, learned])

  const nextCard = useCallback(() => {
    setFlipped(false)
    setSelectedOption(null)
    setShowReaction(null)

    if (currentIndex === flashcards.length - 1) {
      // If we're at the last card, show stats
      if (mode === "quiz") {
        setShowStats(true)
      } else {
        setCurrentIndex(0)
      }
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1)
    }
  }, [currentIndex, flashcards.length, mode])

  const prevCard = useCallback(() => {
    setFlipped(false)
    setSelectedOption(null)
    setShowReaction(null)
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : flashcards.length - 1))
  }, [flashcards.length])

  const resetGame = useCallback(() => {
    selectRandomFlashcards()
  }, [selectRandomFlashcards])

  const handleAnswerSelection = useCallback(
    (option: string) => {
      if (selectedOption) return // Prevent changing answer after selection

      setSelectedOption(option)
      setAttempts(attempts + 1)

      if (option === flashcards[currentIndex].answer) {
        setScore(score + 1)
        setShowReaction("🎉 Correct!")
        triggerConfetti(true)
      } else {
        setShowReaction("❌ Incorrect!")
        setWrongAnswers([...wrongAnswers, currentIndex])
      }
    },
    [attempts, currentIndex, flashcards, score, wrongAnswers, selectedOption],
  )

  const triggerConfetti = (isCorrectAnswer: boolean) => {
    const defaults: ConfettiOptions = {
      spread: 360,
      ticks: 50,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['square', 'circle'] as ('square' | 'circle')[],
      colors: isCorrectAnswer 
        ? ["#FFD700", "#FFA500", "#FF4500"] 
        : ["#00FF00", "#32CD32", "#008000"]
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      origin: { y: 0.7 },
      spread: 50,
      ticks: 200,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['square', 'circle'] as ('square' | 'circle')[],
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    });

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.75,
        origin: { y: 0.7 }
      });
    }, 250);
  };

  const calculateProgress = useCallback(() => {
    if (mode === "study") {
      return (learned.length / flashcards.length) * 100
    } else {
      return ((currentIndex + 1) / flashcards.length) * 100
    }
  }, [currentIndex, flashcards.length, learned.length, mode])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === "home") return

      switch (e.key) {
        case " ":
        case "Enter":
          handleFlip()
          break
        case "ArrowRight":
          nextCard()
          break
        case "ArrowLeft":
          prevCard()
          break
        case "l":
          if (mode === "study") markAsLearned()
          break
        case "1":
        case "2":
        case "3":
        case "4":
          if (mode === "quiz" && flashcards[currentIndex]?.options && !flipped) {
            const optionIndex = Number.parseInt(e.key) - 1
            if (optionIndex >= 0 && optionIndex < flashcards[currentIndex].options!.length) {
              handleAnswerSelection(flashcards[currentIndex].options![optionIndex])
            }
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [mode, currentIndex, flipped, flashcards, handleAnswerSelection, markAsLearned, handleFlip, prevCard, nextCard])

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg font-medium">Loading flashcards...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}
      >
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </button>
      </div>
    )
  }

  // Home screen
  if (mode === "home") {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-4 right-4"
        >
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? "bg-gray-800 text-yellow-300" : "bg-white text-gray-800"} shadow-md`}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </motion.div>

        <motion.h1
          className="text-4xl font-bold mb-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          FlipGyaan
        </motion.h1>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.button
            className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-lg ${darkMode ? "bg-blue-900 hover:bg-blue-800" : "bg-blue-600 hover:bg-blue-700"} text-white transition-all duration-300 transform hover:scale-105`}
            onClick={() => setMode("study")}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookOpen className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">Study Mode</h2>
            <p className="mt-2 text-center text-sm opacity-80">Review flashcards at your own pace</p>
          </motion.button>

          <motion.button
            className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-lg ${darkMode ? "bg-green-900 hover:bg-green-800" : "bg-green-600 hover:bg-green-700"} text-white transition-all duration-300 transform hover:scale-105`}
            onClick={() => setMode("quiz")}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">Quiz Mode</h2>
            <p className="mt-2 text-center text-sm opacity-80">Test your knowledge with multiple choice</p>
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-sm opacity-70">Each round features 5 random flashcards from the collection</p>
          <p className="text-sm opacity-70 mt-1">Press arrow keys to navigate, space to flip cards</p>
          {learned.length > 0 && (
            <p className="mt-2 font-medium">
              You've learned {learned.length} out of {flashcards.length} cards
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  // Stats screen
  if (showStats && mode === "quiz") {
    const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

    return (
      <div
        className={`flex flex-col items-center justify-center min-h-screen p-4 ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full p-8 rounded-xl shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Results</h2>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <p className="text-lg">
                Score: <span className="font-bold">{score} / {flashcards.length}</span>
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <p className="text-lg">
                Accuracy: <span className="font-bold">{accuracy}%</span>
              </p>
              <div className="w-full bg-gray-300 rounded-full h-2.5 mt-2">
                <div
                  className={`h-2.5 rounded-full ${
                    accuracy > 80 ? "bg-green-600" : accuracy > 50 ? "bg-yellow-500" : "bg-red-600"
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {wrongAnswers.length > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <p className="text-lg font-medium mb-2">Questions to review:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {wrongAnswers.map((index) => (
                    <li key={index} className="text-sm">
                      {flashcards[index].question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md ${
                darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
              } text-white flex items-center`}
              onClick={() => setMode("home")}
            >
              <Home className="mr-2 h-4 w-4" /> Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md ${
                darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
              } text-white flex items-center`}
              onClick={resetGame}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main game screen (study or quiz mode)
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}
    >
      {/* Header with navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1 rounded-md ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-200"} flex items-center shadow-sm`}
          onClick={() => setMode("home")}
        >
          <Home className="mr-1 h-4 w-4" /> Home
        </motion.button>

        <h2 className="text-xl font-bold">{mode === "study" ? "Study Mode" : "Quiz Mode"}</h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-2 py-1 rounded-full ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-200"} shadow-sm`}
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {mode === "study" && (
            <span>
              Learned: {learned.length}/{flashcards.length}
            </span>
          )}
          {mode === "quiz" && (
            <span>
              Score: {score}/{attempts}
            </span>
          )}
        </div>
        <div className={`w-full h-2 ${darkMode ? "bg-gray-700" : "bg-gray-300"} rounded-full overflow-hidden`}>
          <motion.div
            className={`h-full ${mode === "study" ? "bg-green-500" : "bg-blue-500"}`}
            initial={{ width: `${calculateProgress()}%` }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>
      </div>

      {/* Shuffle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetGame}
        disabled={isShuffling}
        className={`mb-4 px-3 py-1 rounded-md ${darkMode ? "bg-indigo-700 hover:bg-indigo-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white flex items-center shadow-sm ${isShuffling ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Shuffle className={`mr-1 h-4 w-4 ${isShuffling ? "animate-spin" : ""}`} />
        New Set of Cards
      </motion.button>

      {/* Flashcard */}
      <AnimatePresence mode="wait">
        {!isShuffling && flashcards.length > 0 && (
          <motion.div
            key={`card-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md perspective-1000 mb-6"
          >
            <motion.div
              className={`card-container relative w-full aspect-[3/2] cursor-pointer ${darkMode ? "text-gray-800" : ""}`}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={handleFlip}
              whileHover={{ scale: 1.02 }}
            >
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-xl font-semibold ${darkMode ? "bg-gray-200" : "bg-white"} shadow-xl p-6 rounded-xl border-2 ${mode === "study" ? "border-green-400" : "border-blue-400"}`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="absolute top-3 left-3 text-xs opacity-70">Question</span>
                <div className="text-center">{flashcards[currentIndex]?.question}</div>
                <span className="absolute bottom-3 right-3 text-xs opacity-70">Tap to flip</span>
              </div>
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-xl font-semibold ${darkMode ? "bg-gray-200" : "bg-white"} shadow-xl p-6 rounded-xl border-2 ${mode === "study" ? "border-green-400" : "border-blue-400"}`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="absolute top-3 left-3 text-xs opacity-70">Answer</span>
                <div className="text-center">{flashcards[currentIndex]?.answer}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz options */}
      {mode === "quiz" && flashcards[currentIndex]?.options && !isShuffling && (
        <div className="w-full max-w-md mb-4">
          <AnimatePresence>
            {flashcards[currentIndex].options?.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`w-full px-4 py-3 mt-2 rounded-lg text-left transition-all ${
                  selectedOption === option
                    ? option === flashcards[currentIndex].answer
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white hover:bg-gray-100 shadow-sm"
                }`}
                onClick={() => handleAnswerSelection(option)}
                disabled={!!selectedOption}
              >
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 ${
                      selectedOption === option
                        ? option === flashcards[currentIndex].answer
                          ? "bg-green-700"
                          : "bg-red-700"
                        : darkMode
                          ? "bg-gray-600"
                          : "bg-gray-200"
                    } text-sm`}
                  >
                    {index + 1}
                  </span>
                  {option}
                  {selectedOption === option && (
                    <span className="ml-auto">
                      {option === flashcards[currentIndex].answer ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reaction message */}
      <AnimatePresence>
        {showReaction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold mb-4 ${
              showReaction.includes("Correct")
                ? "text-green-500"
                : showReaction.includes("Incorrect")
                  ? "text-red-500"
                  : "text-yellow-500"
            }`}
          >
            {showReaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={prevCard}
          disabled={isShuffling}
          className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"} shadow-sm flex items-center ${isShuffling ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </motion.button>

        {mode === "study" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={markAsLearned}
            disabled={learned.includes(currentIndex) || isShuffling}
            className={`px-4 py-2 rounded-md flex items-center ${
              learned.includes(currentIndex) || isShuffling
                ? "bg-gray-400 cursor-not-allowed"
                : darkMode
                  ? "bg-green-700 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <Check className="mr-1 h-4 w-4" /> Learned
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextCard}
          disabled={isShuffling}
          className={`px-4 py-2 rounded-md ${
            darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700 text-white"
          } flex items-center ${isShuffling ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </motion.button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-6 text-xs opacity-70 text-center">
        <p>
          Keyboard shortcuts: ← Previous | → Next | Space Flip |{" "}
          {mode === "study" ? "L Mark as Learned" : "1-4 Select Answer"}
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
        
        .shake {
          animation: shake 0.5s;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .dark {
          background-color: #111827;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}

