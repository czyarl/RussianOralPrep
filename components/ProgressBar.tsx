import React from 'react';
import { HistoryMap, QuestionData } from '../types';

interface Props {
  history: HistoryMap;
  questions: QuestionData[];
}

const ProgressBar: React.FC<Props> = ({ history, questions }) => {
  const total = questions.length;
  let mastered = 0;
  let learning = 0;

  questions.forEach(q => {
    const stats = history[q.id];
    if (stats && stats.attempts > 0) {
      // Strict Mastered Logic: 
      // Must be correct AND fluent (perfect).
      // 'perfects' = Total Correct - Total Hesitant.
      const perfects = stats.correct - (stats.hesitant || 0);
      const perfectRate = perfects / stats.attempts;
      
      // To be mastered, >80% of attempts must be PERFECT (not just correct)
      if (perfectRate > 0.8 && stats.attempts >= 2) {
          mastered++;
      } else {
          learning++;
      }
    }
  });

  const unattempted = total - mastered - learning;

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span>已熟练: {mastered}</span>
        <span>练习中: {learning}</span>
        <span>未学: {unattempted}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
        <div 
          className="bg-green-500 h-full transition-all duration-500" 
          style={{ width: `${(mastered / total) * 100}%` }} 
        />
        <div 
          className="bg-amber-400 h-full transition-all duration-500" 
          style={{ width: `${(learning / total) * 100}%` }} 
        />
      </div>
    </div>
  );
};

export default ProgressBar;