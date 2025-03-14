// Quiz data persistence utilities

import { v4 as uuidv4 } from "uuid";

export interface QuizState {
  quizId: string;
  fileName: string;
  totalQuestions: number;
  currentQuestion: number;
  answers: Record<number, string>;
  timeSpent: Record<number, number>;
  globalTimer: number;
  lastUpdated: number;
  pdfObjectUrl?: string;
}

export interface QuizMetadata {
  quizId: string;
  fileName: string;
  totalQuestions: number;
  startedAt: number;
  lastUpdated: number;
  completed: boolean;
}

// Create a new quiz and return its ID
export function createQuiz(fileName: string, totalQuestions: number): string {
  const quizId = uuidv4();

  const quizState: QuizState = {
    quizId,
    fileName,
    totalQuestions,
    currentQuestion: 1,
    answers: {},
    timeSpent: {},
    globalTimer: 0,
    lastUpdated: Date.now(),
  };

  // Save the new quiz state
  saveQuizState(quizState);

  // Add to quiz list
  const quizList = getQuizList();
  quizList.push({
    quizId,
    fileName,
    totalQuestions,
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    completed: false,
  });
  saveQuizList(quizList);

  return quizId;
}

// Save quiz state to localStorage
export function saveQuizState(state: QuizState): void {
  try {
    localStorage.setItem(
      `quiz_${state.quizId}`,
      JSON.stringify({
        ...state,
        lastUpdated: Date.now(),
      })
    );

    // Update quiz list metadata
    updateQuizMetadata(state.quizId, {
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Error saving quiz state:", error);
  }
}

// Get quiz state from localStorage
export function getQuizState(quizId: string): QuizState | null {
  try {
    const data = localStorage.getItem(`quiz_${quizId}`);
    if (!data) return null;

    return JSON.parse(data) as QuizState;
  } catch (error) {
    console.error("Error retrieving quiz state:", error);
    return null;
  }
}

// Mark a quiz as completed
export function completeQuiz(quizId: string): void {
  updateQuizMetadata(quizId, {
    completed: true,
  });
}

// Get list of all quizzes
export function getQuizList(): QuizMetadata[] {
  try {
    const data = localStorage.getItem("quiz_list");
    if (!data) return [];

    return JSON.parse(data) as QuizMetadata[];
  } catch (error) {
    console.error("Error retrieving quiz list:", error);
    return [];
  }
}

// Save quiz list
function saveQuizList(quizList: QuizMetadata[]): void {
  try {
    localStorage.setItem("quiz_list", JSON.stringify(quizList));
  } catch (error) {
    console.error("Error saving quiz list:", error);
  }
}

// Update quiz metadata
function updateQuizMetadata(
  quizId: string,
  updates: Partial<QuizMetadata>
): void {
  const quizList = getQuizList();
  const index = quizList.findIndex((quiz) => quiz.quizId === quizId);

  if (index !== -1) {
    quizList[index] = {
      ...quizList[index],
      ...updates,
    };
    saveQuizList(quizList);
  }
}

// Calculate elapsed time since last update
export function calculateElapsedTime(lastUpdated: number): number {
  const now = Date.now();
  return Math.floor((now - lastUpdated) / 1000);
}

// Delete a quiz
export function deleteQuiz(quizId: string): void {
  try {
    // Remove quiz state
    localStorage.removeItem(`quiz_${quizId}`);

    // Remove from quiz list
    const quizList = getQuizList();
    const updatedList = quizList.filter((quiz) => quiz.quizId !== quizId);
    saveQuizList(updatedList);
  } catch (error) {
    console.error("Error deleting quiz:", error);
  }
}
