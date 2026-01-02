import { QuestionData, HistoryMap } from '../types';

/**
 * Selects the next question based on the user's history and selected mode.
 * Optimized for "Cramming" (Turn-based logic).
 */
export const selectNextQuestion = (
  allQuestions: QuestionData[],
  history: HistoryMap,
  mode: 'RANDOM' | 'SMART',
  currentId?: number
): QuestionData => {
  
  // 1. COOLDOWN LOGIC (Anti-Nagging)
  // Identify questions answered recently to enforce a "spacing" buffer.
  let pool = [...allQuestions];
  // Buffer size: 4 questions.
  const cooldownSize = Math.min(4, Math.floor(allQuestions.length / 2));
  
  // Calculate Global Turn Count (Logical Time)
  const globalAttempts = Object.values(history).reduce((sum, stats) => sum + stats.attempts, 0);

  if (cooldownSize > 0 && Object.keys(history).length > 0) {
    // Sort by turn number (descending) to find most recent
    const recentIds = Object.keys(history)
      .map(Number)
      .sort((a, b) => {
          const turnA = history[a].lastAttemptTurn || 0; // Fallback to 0 for legacy data
          const turnB = history[b].lastAttemptTurn || 0;
          
          // If turns are equal (legacy data), fallback to timestamp
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
  // Uses "Turns Since Last Attempt" as the primary driver for review.
  
  const scoredQuestions = pool.map(q => {
    const stats = history[q.id];
    let score = 0;

    if (!stats) {
      // --- Group: NEW ---
      // Base: 900. (Increased from 600)
      // This allows user to see more new cards before old cards overtake them.
      score = 900; 
    } else {
      // Infer streak for legacy data
      let streak = stats.streak;
      if (streak === undefined) {
          if (stats.attempts > 0 && stats.correct === stats.attempts) {
              streak = stats.attempts;
          } else {
              streak = 0;
          }
      }

      // Turn Factor (Staleness for Cramming)
      // How many questions have I answered since this one?
      const lastTurn = stats.lastAttemptTurn || 0;
      const turnsSince = globalAttempts - lastTurn;

      // WEIGHTS FOR CRAMMING (Revised for larger loop)
      
      if (streak === 0) {
          // --- Group: CRITICAL (Wrong/Hesitant) ---
          // Base: 2000.
          // These MUST interrupt the flow. If you got it wrong, do it again soon.
          score = 2000 + (turnsSince * 100);
      } else if (streak === 1) {
          // --- Group: REVIEW 1 (Right once) ---
          // Base: 500. Growth: +30/turn.
          // To beat "New" (900), needs gap of 400.
          // 400 / 30 = ~13 turns.
          // Result: After doing a new card, you won't see it again for ~13 turns.
          // This expands the active loop from ~6 to ~13.
          score = 500 + (turnsSince * 30);
      } else if (streak === 2) {
           // --- Group: REVIEW 2 (Right twice) ---
           // Base: 400. Growth: +15/turn.
           // To beat "New" (900), needs gap of 500.
           // 500 / 15 = ~33 turns.
           // You basically won't see this until you finish the whole deck of 30.
           score = 400 + (turnsSince * 15);
      } else {
          // --- Group: MASTERED (Right 3+ times) ---
          // Base: 100. Growth: +5/turn.
          // Very low priority.
          score = 100 + (turnsSince * 5);
      }
    }

    // Add small random jitter (0-15) to break ties and feel organic
    score += Math.random() * 15;
    
    return { ...q, score };
  });

  // Sort descending by score
  scoredQuestions.sort((a, b) => b.score - a.score);

  // Weighted Selection from top candidates
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