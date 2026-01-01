import { HistoryMap, UserStats, Gender } from '../types';

const STORAGE_KEY = 'russian-oral-history-v1';
const CUSTOM_ANSWERS_KEY = 'russian-oral-custom-answers-v1';
const VOICE_PREF_KEY = 'russian-oral-voice-pref-v1';
const RATE_PREF_KEY = 'russian-oral-voice-rate-v1';
const GENDER_PREF_KEY = 'russian-oral-gender-v1';

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

export const getPreferredVoiceURI = (): string | null => {
  return localStorage.getItem(VOICE_PREF_KEY);
};

export const savePreferredVoiceURI = (uri: string) => {
  localStorage.setItem(VOICE_PREF_KEY, uri);
};

export const getPreferredRate = (): number => {
  const val = localStorage.getItem(RATE_PREF_KEY);
  return val ? parseFloat(val) : 0.9; // Default to 0.9 if not set
};

export const savePreferredRate = (rate: number) => {
  localStorage.setItem(RATE_PREF_KEY, rate.toString());
};

export const getPreferredGender = (): Gender => {
  const val = localStorage.getItem(GENDER_PREF_KEY);
  return (val === 'F') ? 'F' : 'M'; // Default to Male if not set
};

export const savePreferredGender = (gender: Gender) => {
  localStorage.setItem(GENDER_PREF_KEY, gender);
};