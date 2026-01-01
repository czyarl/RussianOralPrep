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

export const saveAttempt = (questionId: number, result: 'fail' | 'hesitant' | 'perfect') => {
  const history = getHistory();
  const currentStats: UserStats = history[questionId] || {
    attempts: 0,
    correct: 0,
    hesitant: 0,
    lastAttemptAt: 0,
  };

  const isCorrect = result !== 'fail';
  const isHesitant = result === 'hesitant';

  const newStats: UserStats = {
    attempts: currentStats.attempts + 1,
    correct: isCorrect ? currentStats.correct + 1 : currentStats.correct,
    hesitant: isHesitant ? (currentStats.hesitant || 0) + 1 : (currentStats.hesitant || 0),
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
    // Note: We usually keep preferences like voice/gender intact during a progress reset,
    // unless a "Hard Factory Reset" is requested.
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

// --- SAVE GAME / BACKUP FEATURES ---

interface SaveData {
    history: HistoryMap;
    customAnswers: Record<number, string>;
    preferences: {
        voice: string | null;
        rate: number;
        gender: Gender;
    };
    timestamp: number;
    version: number;
}

export const exportSaveData = (): string => {
    const data: SaveData = {
        history: getHistory(),
        customAnswers: getCustomAnswers(),
        preferences: {
            voice: getPreferredVoiceURI(),
            rate: getPreferredRate(),
            gender: getPreferredGender(),
        },
        timestamp: Date.now(),
        version: 1
    };
    return JSON.stringify(data, null, 2);
};

export const importSaveData = (jsonString: string): boolean => {
    try {
        const data: SaveData = JSON.parse(jsonString);
        
        // Basic validation
        if (!data.history || !data.customAnswers) {
            throw new Error("Invalid save file format");
        }

        // Restore Data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.history));
        localStorage.setItem(CUSTOM_ANSWERS_KEY, JSON.stringify(data.customAnswers));
        
        // Restore Preferences
        if (data.preferences) {
            if (data.preferences.voice) localStorage.setItem(VOICE_PREF_KEY, data.preferences.voice);
            if (data.preferences.rate) localStorage.setItem(RATE_PREF_KEY, data.preferences.rate.toString());
            if (data.preferences.gender) localStorage.setItem(GENDER_PREF_KEY, data.preferences.gender);
        }

        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
};