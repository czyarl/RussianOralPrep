import React from 'react';
import { X, CheckCircle, Clock, Circle, AlertCircle } from 'lucide-react';
import { HistoryMap, QuestionData } from '../types';

interface Props {
  history: HistoryMap;
  onSelect: (id: number) => void;
  onClose: () => void;
  currentId: number;
  questions: QuestionData[];
}

const QuestionList: React.FC<Props> = ({ history, onSelect, onClose, currentId, questions }) => {
  const getStatus = (id: number) => {
    const stats = history[id];
    if (!stats || stats.attempts === 0) return 'unattempted';
    
    const perfects = stats.correct - (stats.hesitant || 0);
    const perfectRate = perfects / stats.attempts;
    
    if (perfectRate > 0.8 && stats.attempts >= 2) return 'mastered';
    return 'learning';
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-900">题目列表</h2>
        <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.map((q) => {
          const status = getStatus(q.id);
          const isCurrent = q.id === currentId;
          const stats = history[q.id];
          
          let statusColor = "border-gray-200 bg-white hover:border-blue-300";
          let Icon = Circle;
          let iconColor = "text-gray-300";

          if (status === 'mastered') {
            statusColor = "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300";
            Icon = CheckCircle;
            iconColor = "text-emerald-500";
          } else if (status === 'learning') {
            statusColor = "border-amber-200 bg-amber-50/50 hover:border-amber-300";
            Icon = AlertCircle; // Changed icon to represent 'learning/alert'
            iconColor = "text-amber-500";
          }
          
          if (isCurrent) {
              statusColor = "border-blue-500 ring-1 ring-blue-500 bg-blue-50";
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              className={`w-full text-left p-4 rounded-xl border ${statusColor} transition-all active:scale-[0.98] flex gap-4 items-start`}
            >
              <div className={`mt-1 ${iconColor} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-gray-400">#{q.id}</span>
                    {stats && (
                        <span className={`text-xs font-medium ${status === 'mastered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                           {/* Show Correct (including hesitant) / Total */}
                            {stats.correct}/{stats.attempts}
                        </span>
                    )}
                 </div>
                 <h3 className="font-medium text-gray-900 mb-1 truncate">{q.question}</h3>
                 <p className="text-sm text-gray-500 truncate">{q.questionZh}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionList;