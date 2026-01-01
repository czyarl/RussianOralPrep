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
  const scoredQuestions = pool.map(q => {
    const stats = history[q.id];
    let score = 0;

    if (!stats) {
      // Never seen: Highest priority
      score = 100;
    } else {
      // Calculate Failures
      const failures = stats.attempts - stats.correct;
      const hesitant = stats.hesitant || 0;
      
      // WEIGHTING FORMULA:
      // Failures (+5): Biggest signal to show again.
      // Hesitant (+3): Strong signal to show again.
      // Correct (-1): Reduces score, pushes it back.
      // Note: 'stats.correct' includes 'hesitant' attempts in storage, 
      // so if we are hesitant, net score change is +3 - 1 = +2 (Score goes up -> See again soon)
      // If we are perfect, net score change is 0 - 1 = -1 (Score goes down -> See later)
      
      score = (failures * 5) + (hesitant * 3) - (stats.correct * 1);
      
      // Add 'staleness' factor: longer since last seen -> higher score
      const hoursSinceLastSeen = (Date.now() - stats.lastAttemptAt) / (1000 * 60 * 60);
      score += Math.min(hoursSinceLastSeen, 10); // Cap staleness bonus
    }
    
    // Add a tiny random jitter to break ties
    return { ...q, score: score + Math.random() };
  });

  // Sort descending by score (Higher score = Needs practice more)
  scoredQuestions.sort((a, b) => b.score - a.score);

  // Pick from the top 5 candidates to keep it slightly unpredictable but focused
  const topCandidates = scoredQuestions.slice(0, 5);
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  
  return topCandidates[randomIndex];
};