import { QuestionData, HistoryMap } from '../types';

/**
 * Selects the next question based on the user's history and selected mode.
 */
export const selectNextQuestion = (
  allQuestions: QuestionData[],
  history: HistoryMap,
  mode: 'RANDOM' | 'SMART',
  currentId?: number
): QuestionData => {
  
  // Filter out the current question to avoid immediate repeats (unless it's the only one)
  let pool = allQuestions;
  if (allQuestions.length > 1 && currentId) {
    pool = allQuestions.filter(q => q.id !== currentId);
  }

  if (mode === 'RANDOM') {
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  // SMART Mode: Weight items based on "needs practice"
  // Score = (Failures * 3) - (Successes) + (Factor for never seen)
  const scoredQuestions = pool.map(q => {
    const stats = history[q.id];
    let score = 0;

    if (!stats) {
      // Never seen: High priority
      score = 100;
    } else {
      const failures = stats.attempts - stats.correct;
      // High weight on failures
      score = (failures * 5) - (stats.correct * 2);
      
      // Add 'staleness' factor: longer since last seen -> higher score
      const hoursSinceLastSeen = (Date.now() - stats.lastAttemptAt) / (1000 * 60 * 60);
      score += Math.min(hoursSinceLastSeen, 10); // Cap staleness bonus
    }
    
    // Add a tiny random jitter to break ties
    return { ...q, score: score + Math.random() };
  });

  // Sort descending by score
  scoredQuestions.sort((a, b) => b.score - a.score);

  // Pick from the top 5 candidates to keep it slightly unpredictable but focused
  const topCandidates = scoredQuestions.slice(0, 5);
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  
  return topCandidates[randomIndex];
};
