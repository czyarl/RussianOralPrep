import React, { useState, useEffect, useCallback } from 'react';
import { QUESTIONS } from './constants';
import { StudyMode, CardState, HistoryMap, QuestionData } from './types';
import { getHistory, saveAttempt, resetHistory, getCustomAnswers, saveCustomAnswer } from './services/storage';
import { selectNextQuestion } from './services/algorithm';
import { speakRussian } from './services/tts';
import { Volume2, RefreshCw, Brain, Eye, CheckCircle, XCircle, RotateCcw, Edit2, Save, X, Undo2, LayoutList } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import QuestionList from './components/QuestionList';

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryMap>({});
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [mode, setMode] = useState<StudyMode>(StudyMode.SMART);
  const [cardState, setCardState] = useState<CardState>(CardState.LISTENING);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showList, setShowList] = useState(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  // Initialize
  useEffect(() => {
    const loadedHistory = getHistory();
    const loadedCustomAnswers = getCustomAnswers();
    setHistory(loadedHistory);
    setCustomAnswers(loadedCustomAnswers);

    // Initial pick
    const firstQ = selectNextQuestion(QUESTIONS, loadedHistory, mode);
    setCurrentQuestion(firstQ);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle TTS Autoplay
  useEffect(() => {
    if (autoPlay && currentQuestion && cardState === CardState.LISTENING && !showList) {
      // Small timeout to allow UI to settle
      const timer = setTimeout(() => {
        speakRussian(currentQuestion.question);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, cardState, autoPlay, showList]);

  const handleNext = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return;

    // Reset editing state
    setIsEditing(false);

    // Save result
    const newHistory = saveAttempt(currentQuestion.id, isCorrect);
    setHistory(newHistory);

    // Pick next
    const nextQ = selectNextQuestion(QUESTIONS, newHistory, mode, currentQuestion.id);
    setCurrentQuestion(nextQ);
    setCardState(CardState.LISTENING);
  }, [currentQuestion, mode]);

  const handleReveal = () => {
    setCardState(CardState.REVEALED);
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakRussian(text);
  };

  const toggleMode = () => {
    const newMode = mode === StudyMode.RANDOM ? StudyMode.SMART : StudyMode.RANDOM;
    setMode(newMode);
  };

  const handleReset = () => {
      if(window.confirm("确定要清除所有学习进度（包括自定义答案）吗？")) {
          resetHistory();
      }
  }

  // Custom Answer Handlers
  const handleStartEdit = () => {
    if (!currentQuestion) return;
    const currentAnswer = customAnswers[currentQuestion.id] || currentQuestion.answer;
    setEditText(currentAnswer);
    setIsEditing(true);
  }

  const handleSaveEdit = () => {
      if (!currentQuestion) return;
      const newMap = saveCustomAnswer(currentQuestion.id, editText);
      setCustomAnswers(newMap);
      setIsEditing(false);
  }

  const handleCancelEdit = () => {
      setIsEditing(false);
  }

  const handleRevertToOriginal = () => {
      if (!currentQuestion) return;
      if (window.confirm("确定要恢复默认答案吗？")) {
        const newMap = saveCustomAnswer(currentQuestion.id, null);
        setCustomAnswers(newMap);
        setIsEditing(false); // Stop editing if we were editing
      }
  }

  const handleQuestionSelect = (id: number) => {
      const q = QUESTIONS.find(q => q.id === id);
      if (q) {
          setCurrentQuestion(q);
          setCardState(CardState.LISTENING);
          setIsEditing(false);
          setShowList(false);
      }
  }

  if (!currentQuestion) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  const hasCustomAnswer = !!customAnswers[currentQuestion.id];
  const displayAnswer = customAnswers[currentQuestion.id] || currentQuestion.answer;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center py-8 px-4">
      {showList && (
        <QuestionList 
            history={history}
            currentId={currentQuestion.id}
            onSelect={handleQuestionSelect}
            onClose={() => setShowList(false)}
        />
      )}
      <div className="w-full max-w-md flex flex-col h-full">
        
        {/* Header */}
        <header className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">俄语口语特训</h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowList(true)}
                    className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-full transition-all"
                    title="题目列表"
                >
                    <LayoutList size={20} />
                </button>
                <button 
                    onClick={handleReset}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-full transition-all"
                    title="重置进度"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
          </div>
          
          <ProgressBar history={history} />
          
          <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${mode === StudyMode.SMART ? 'text-blue-600' : 'text-gray-400'}`}>
                {mode === StudyMode.SMART ? '智能推荐' : '随机模式'}
              </span>
            </div>
            <button 
              onClick={toggleMode}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
            >
              {mode === StudyMode.SMART ? <Brain size={14} /> : <RefreshCw size={14} />}
              切换模式
            </button>
          </div>
        </header>

        {/* Main Card Area */}
        <main className="flex-1 flex flex-col justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative min-h-[400px] flex flex-col">
            
            {/* Question ID Badge */}
            <div className="absolute top-4 left-4 bg-gray-100 text-gray-500 text-xs font-mono px-2 py-1 rounded">
              #{currentQuestion.id}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
              
              {/* Question Audio Button - Always Visible */}
              <button 
                onClick={(e) => handlePlayAudio(e, currentQuestion.question)}
                className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-inner"
              >
                <Volume2 size={48} strokeWidth={1.5} />
              </button>

              {/* Text Content */}
              <div className="space-y-6 w-full text-left">
                {cardState === CardState.LISTENING ? (
                  <div className="text-gray-400 italic text-lg animate-pulse text-center">
                    请听录音并尝试回答...
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
                    {/* Question Section */}
                    <div className="space-y-2 text-center">
                        <p className="text-sm text-gray-400 uppercase tracking-wide">问题</p>
                        <h2 className="text-2xl font-serif text-gray-900 leading-tight">
                        {currentQuestion.question}
                        </h2>
                        <p className="text-gray-500 font-light">{currentQuestion.questionZh}</p>
                    </div>
                    
                    <div className="w-full h-px bg-gray-100" />

                    {/* Answer Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">
                                {hasCustomAnswer ? "我的回答" : "参考回答"}
                            </p>
                            
                            {/* Answer Controls */}
                            {!isEditing && (
                                <div className="flex gap-2">
                                     <button 
                                        onClick={(e) => handlePlayAudio(e, displayAnswer)} 
                                        className="p-1.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                                        title="朗读回答"
                                    >
                                        <Volume2 size={16} />
                                     </button>
                                     <button 
                                        onClick={handleStartEdit} 
                                        className="p-1.5 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                        title="编辑/自定义回答"
                                    >
                                        <Edit2 size={16} />
                                     </button>
                                     {hasCustomAnswer && (
                                         <button 
                                            onClick={handleRevertToOriginal} 
                                            className="p-1.5 text-orange-600 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors"
                                            title="恢复默认答案"
                                        >
                                            <Undo2 size={16} />
                                         </button>
                                     )}
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="bg-gray-50 p-3 rounded-lg border border-blue-200 space-y-3">
                                <textarea 
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] text-lg font-medium"
                                    placeholder="输入你的回答..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50 text-sm"
                                    >
                                        <X size={14} /> 取消
                                    </button>
                                    <button 
                                        onClick={handleSaveEdit}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        <Save size={14} /> 保存
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-xl text-emerald-700 font-medium leading-relaxed text-center">
                                    {displayAnswer}
                                </h3>
                                
                                {hasCustomAnswer && (
                                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-500 border border-gray-100">
                                        <p className="text-xs uppercase font-semibold mb-1">原文参考:</p>
                                        <p>{currentQuestion.answer}</p>
                                    </div>
                                )}
                                
                                <p className="text-gray-500 font-light text-center">{currentQuestion.answerZh}</p>
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              {cardState === CardState.LISTENING ? (
                <button
                  onClick={handleReveal}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={20} />
                  查看答案
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleNext(false)}
                    className="py-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    没反应过来
                  </button>
                  <button
                    onClick={() => handleNext(true)}
                    className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    反应过来了
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer controls */}
        <footer className="text-center">
            <label className="inline-flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={autoPlay} 
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                />
                自动播放问题读音
            </label>
        </footer>
      </div>
    </div>
  );
};

export default App;