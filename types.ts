export interface QuestionData {
  id: number;
  question: string;
  answer: string;
  questionZh: string;
  answerZh: string;
}

export interface UserStats {
  attempts: number;
  correct: number;
  hesitant?: number; 
  lastAttemptAt: number; // timestamp
  lastAttemptTurn?: number; // New: Logic counter (turn number) when this was last answered
  streak?: number; // Consecutive perfect answers
}

export type HistoryMap = Record<number, UserStats>;

export enum StudyMode {
  RANDOM = 'RANDOM',
  SMART = 'SMART', // Prioritize unseen or wrong answers
  ORDERED = 'ORDERED' // Shuffle once, go through all, then reshuffle
}

export enum CardState {
  LISTENING = 'LISTENING',
  REVEALED = 'REVEALED'
}

export type Gender = 'M' | 'F';