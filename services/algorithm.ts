import { QuestionData, HistoryMap } from '../types';

/**
 * Selects the next question based on the user's history and selected mode.
 * Optimized for "Cramming" (Turn-based logic).
 * used for RANDOM and SMART modes.
 */
export const selectNextQuestion = (
  allQuestions: QuestionData[],
  history: HistoryMap,
  mode: 'RANDOM' | 'SMART',
  currentId?: number
): QuestionData => {
  
  // 1. COOLDOWN LOGIC (Anti-Nagging)
  let pool = [...allQuestions];
  const cooldownSize = Math.min(4, Math.floor(allQuestions.length / 2));
  
  const globalAttempts = Object.values(history).reduce((sum, stats) => sum + stats.attempts, 0);

  if (cooldownSize > 0 && Object.keys(history).length > 0) {
    const recentIds = Object.keys(history)
      .map(Number)
      .sort((a, b) => {
          const turnA = history[a].lastAttemptTurn || 0; 
          const turnB = history[b].lastAttemptTurn || 0;
          if (turnA === turnB) {
              return (history[b].lastAttemptAt || 0) - (history[a].lastAttemptAt || 0);
          }
          return turnB - turnA;
      })
      .slice(0, cooldownSize);

    const poolAfterCooldown = pool.filter(q => !recentIds.includes(q.id));
    if (poolAfterCooldown.length > 0) {
      pool = poolAfterCooldown;
    }
  }

  // 2. RANDOM MODE
  if (mode === 'RANDOM') {
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  // 3. SMART MODE (Cramming Optimized)
  const scoredQuestions = pool.map(q => {
    const stats = history[q.id];
    let score = 0;

    if (!stats) {
      score = 900; 
    } else {
      let streak = stats.streak;
      if (streak === undefined) {
          if (stats.attempts > 0 && stats.correct === stats.attempts) {
              streak = stats.attempts;
          } else {
              streak = 0;
          }
      }

      const lastTurn = stats.lastAttemptTurn || 0;
      const turnsSince = globalAttempts - lastTurn;

      if (streak === 0) {
          score = 2000 + (turnsSince * 100);
      } else if (streak === 1) {
          score = 500 + (turnsSince * 30);
      } else if (streak === 2) {
           score = 400 + (turnsSince * 15);
      } else {
          score = 100 + (turnsSince * 5);
      }
    }
    score += Math.random() * 15;
    return { ...q, score };
  });

  scoredQuestions.sort((a, b) => b.score - a.score);

  const candidateCount = Math.min(5, scoredQuestions.length);
  const candidates = scoredQuestions.slice(0, candidateCount);
  
  const totalScore = candidates.reduce((sum, item) => sum + item.score, 0);
  let randomValue = Math.random() * totalScore;
  
  for (const candidate of candidates) {
    randomValue -= candidate.score;
    if (randomValue <= 0) {
      return candidate;
    }
  }

  return candidates[0];
};

/**
 * Handles the logic for ORDERED mode.
 * Returns the next question and the updated queue.
 * If queue is empty, generates a new shuffled list of all IDs.
 */
export const getOrderedQuestion = (
    allQuestions: QuestionData[], 
    currentQueue: number[]
): { question: QuestionData, newQueue: number[] } => {
    
    let queue = [...currentQueue];

    // If queue is empty, create a new full shuffled deck
    if (queue.length === 0) {
        queue = allQuestions.map(q => q.id);
        
        // Fisher-Yates Shuffle
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
    }

    // Take the first one
    const nextId = queue[0];
    const newQueue = queue.slice(1); // Remove it from queue

    const question = allQuestions.find(q => q.id === nextId) || allQuestions[0];

    return { question, newQueue };
};