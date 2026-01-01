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
    if (stats) {
      // Simple heuristic: If accuracy > 80% and attempts >= 2, it's mastered
      if (stats.attempts >= 1) {
          const accuracy = stats.correct / stats.attempts;
          if (accuracy > 0.8 && stats.attempts >= 2) {
              mastered++;
          } else {
              learning++;
          }
      }
    }
  });

  const unattempted = total - mastered - learning;

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span>掌握: {mastered}</span>
        <span>学习中: {learning}</span>
        <span>未学: {unattempted}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
        <div 
          className="bg-green-500 h-full transition-all duration-500" 
          style={{ width: `${(mastered / total) * 100}%` }} 
        />
        <div 
          className="bg-yellow-400 h-full transition-all duration-500" 
          style={{ width: `${(learning / total) * 100}%` }} 
        />
      </div>
    </div>
  );
};

export default ProgressBar;