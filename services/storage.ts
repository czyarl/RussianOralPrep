import { HistoryMap, UserStats } from '../types';

const STORAGE_KEY = 'russian-oral-history-v1';
const CUSTOM_ANSWERS_KEY = 'russian-oral-custom-answers-v1';

export const getHistory = (): HistoryMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load history", e);
    return {};
  }
};

export const saveAttempt = (questionId: number, isCorrect: boolean) => {
  const history = getHistory();
  const currentStats: UserStats = history[questionId] || {
    attempts: 0,
    correct: 0,
    lastAttemptAt: 0,
  };

  const newStats: UserStats = {
    attempts: currentStats.attempts + 1,
    correct: isCorrect ? currentStats.correct + 1 : currentStats.correct,
    lastAttemptAt: Date.now(),
  };

  const updatedHistory = {
    ...history,
    [questionId]: newStats,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const resetHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ANSWERS_KEY);
    window.location.reload();
}

export const getCustomAnswers = (): Record<number, string> => {
  try {
    const raw = localStorage.getItem(CUSTOM_ANSWERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load custom answers", e);
    return {};
  }
};

export const saveCustomAnswer = (questionId: number, answer: string | null) => {
    const current = getCustomAnswers();
    if (answer === null || answer.trim() === '') {
        delete current[questionId];
    } else {
        current[questionId] = answer.trim();
    }
    localStorage.setItem(CUSTOM_ANSWERS_KEY, JSON.stringify(current));
    return current;
};
