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
  lastAttemptAt: number; // timestamp
}

export type HistoryMap = Record<number, UserStats>;

export enum StudyMode {
  RANDOM = 'RANDOM',
  SMART = 'SMART' // Prioritize unseen or wrong answers
}

export enum CardState {
  LISTENING = 'LISTENING',
  REVEALED = 'REVEALED'
}

export type Gender = 'M' | 'F';