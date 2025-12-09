export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
}

export const mathQuestions: Question[] = [
  {
    id: "math-1",
    question: "Vad är 3 + 4?",
    options: ["6", "7", "8", "5"],
    correctIndex: 1,
    difficulty: "easy",
  },
  {
    id: "math-2",
    question: "Vad är 8 - 3?",
    options: ["4", "6", "5", "7"],
    correctIndex: 2,
    difficulty: "easy",
  },
  {
    id: "math-3",
    question: "Vad är 5 × 2?",
    options: ["7", "12", "10", "8"],
    correctIndex: 2,
    difficulty: "easy",
  },
  {
    id: "math-4",
    question: "Vad är 12 ÷ 4?",
    options: ["2", "4", "3", "6"],
    correctIndex: 2,
    difficulty: "medium",
  },
  {
    id: "math-5",
    question: "Vad är 7 + 8?",
    options: ["14", "16", "15", "13"],
    correctIndex: 2,
    difficulty: "medium",
  },
  {
    id: "math-6",
    question: "Vad är 9 × 6?",
    options: ["54", "56", "48", "52"],
    correctIndex: 0,
    difficulty: "medium",
  },
  {
    id: "math-7",
    question: "Vad är 144 ÷ 12?",
    options: ["11", "13", "12", "14"],
    correctIndex: 2,
    difficulty: "hard",
  },
  {
    id: "math-8",
    question: "Vad är 15 × 15?",
    options: ["215", "225", "235", "245"],
    correctIndex: 1,
    difficulty: "hard",
  },
  {
    id: "math-9",
    question: "Vad är √81?",
    options: ["7", "8", "9", "10"],
    correctIndex: 2,
    difficulty: "hard",
  },
  {
    id: "math-10",
    question: "Vad är 25% av 80?",
    options: ["15", "20", "25", "30"],
    correctIndex: 1,
    difficulty: "hard",
  },
];

export const getQuestionsByDifficulty = (difficulty: "easy" | "medium" | "hard") => {
  return mathQuestions.filter((q) => q.difficulty === difficulty);
};

export const getRandomQuestions = (count: number) => {
  const shuffled = [...mathQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
