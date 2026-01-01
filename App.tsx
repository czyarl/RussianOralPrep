import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getQuestions } from './constants';
import { StudyMode, CardState, HistoryMap, QuestionData, Gender } from './types';
import { 
    getHistory, saveAttempt, 
    getCustomAnswers, saveCustomAnswer, 
    getPreferredVoiceURI, savePreferredVoiceURI,
    getPreferredRate, savePreferredRate,
    getPreferredGender, savePreferredGender
} from './services/storage';
import { selectNextQuestion } from './services/algorithm';
import { speakRussian, GOOGLE_VOICE_URI, YOUDAO_VOICE_URI, BAIDU_VOICE_URI, SOGOU_VOICE_URI, VoiceOption } from './services/tts';
import { Volume2, RefreshCw, Brain, Eye, CheckCircle, XCircle, Edit2, Save, X, Undo2, LayoutList, Highlighter, Mic, Gauge, User, Settings, AlertTriangle, Sparkles } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import QuestionList from './components/QuestionList';
import SaveManager from './components/SaveManager';

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryMap>({});
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [mode, setMode] = useState<StudyMode>(StudyMode.SMART);
  const [cardState, setCardState] = useState<CardState>(CardState.LISTENING);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showList, setShowList] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  
  // Settings State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [gender, setGender] = useState<Gender>('M');
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived data
  const questions = useMemo(() => getQuestions(gender), [gender]);

  // Initialize Data
  useEffect(() => {
    const loadedHistory = getHistory();
    const loadedCustomAnswers = getCustomAnswers();
    setHistory(loadedHistory);
    setCustomAnswers(loadedCustomAnswers);
    
    // Load prefs
    setSpeechRate(getPreferredRate());
    const savedGender = getPreferredGender();
    setGender(savedGender);
    
    // Initial pick uses the saved gender immediately
    const initialQuestions = getQuestions(savedGender);
    const firstQ = selectNextQuestion(initialQuestions, loadedHistory, mode);
    setCurrentQuestion(firstQ);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize Voices
  useEffect(() => {
      const loadVoices = () => {
          const allVoices = window.speechSynthesis.getVoices();
          // Filter for Russian voices
          const ruVoices = allVoices.filter(v => v.lang.toLowerCase().includes('ru'));
          setVoices(ruVoices);

          // Try to restore saved preference
          let savedURI = getPreferredVoiceURI();
          
          // Legacy migration: If saved URI was the now-deleted StreamElements, reset it.
          if (savedURI === 'online-streamelements') {
              savedURI = ""; // Reset to default
          }

          // Check if saved URI matches a browser voice OR is one of our special Online ones
          const savedVoiceExists = ruVoices.find(v => v.voiceURI === savedURI);
          
          if ([GOOGLE_VOICE_URI, YOUDAO_VOICE_URI, BAIDU_VOICE_URI, SOGOU_VOICE_URI].includes(savedURI || '')) {
             setSelectedVoiceURI(savedURI!);
          } else if (savedURI && savedVoiceExists) {
              setSelectedVoiceURI(savedURI);
          } else if (ruVoices.length > 0) {
              // Default to the first Google or Microsoft voice if available, otherwise first Russian voice
              const bestVoice = ruVoices.find(v => v.name.includes('Google')) || 
                                ruVoices.find(v => v.name.includes('Microsoft')) || 
                                ruVoices[0];
              setSelectedVoiceURI(bestVoice.voiceURI);
          } else {
              // Fallback if no local voices found (rare)
              setSelectedVoiceURI(GOOGLE_VOICE_URI);
          }
      };

      loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Update current question object when gender changes (if current ID exists)
  useEffect(() => {
      if (currentQuestion) {
          const updatedQ = questions.find(q => q.id === currentQuestion.id);
          if (updatedQ) {
              setCurrentQuestion(updatedQ);
          }
      }
  }, [gender, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const getActiveVoice = (): VoiceOption | SpeechSynthesisVoice | null => {
      if (selectedVoiceURI === GOOGLE_VOICE_URI) {
          return { name: 'Google Translate', voiceURI: GOOGLE_VOICE_URI, lang: 'ru-RU' };
      }
      if (selectedVoiceURI === YOUDAO_VOICE_URI) {
          return { name: 'Youdao Dictionary', voiceURI: YOUDAO_VOICE_URI, lang: 'ru-RU' };
      }
      if (selectedVoiceURI === BAIDU_VOICE_URI) {
          return { name: 'Baidu TTS', voiceURI: BAIDU_VOICE_URI, lang: 'ru-RU' };
      }
      if (selectedVoiceURI === SOGOU_VOICE_URI) {
          return { name: 'Sogou TTS', voiceURI: SOGOU_VOICE_URI, lang: 'ru-RU' };
      }
      return voices.find(v => v.voiceURI === selectedVoiceURI) || null;
  }

  // Handle TTS Autoplay
  useEffect(() => {
    if (autoPlay && currentQuestion && cardState === CardState.LISTENING && !showList && !showSaveManager) {
      // Small timeout to allow UI to settle
      const timer = setTimeout(() => {
        speakRussian(currentQuestion.question, getActiveVoice(), speechRate, gender);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, cardState, autoPlay, showList, showSaveManager, selectedVoiceURI, voices, speechRate, gender]); 

  const handleNext = useCallback((result: 'fail' | 'hesitant' | 'perfect') => {
    if (!currentQuestion) return;

    // Reset editing state
    setIsEditing(false);

    // Save result
    const newHistory = saveAttempt(currentQuestion.id, result);
    setHistory(newHistory);

    // Pick next using the CURRENT questions list (which respects gender)
    const nextQ = selectNextQuestion(questions, newHistory, mode, currentQuestion.id);
    setCurrentQuestion(nextQ);
    setCardState(CardState.LISTENING);
  }, [currentQuestion, mode, questions]);

  const toggleMode = () => {
    setMode(prev => prev === StudyMode.SMART ? StudyMode.RANDOM : StudyMode.SMART);
  };

  const handleReveal = () => {
    setCardState(CardState.REVEALED);
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakRussian(text, getActiveVoice(), speechRate, gender);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const uri = e.target.value;
      setSelectedVoiceURI(uri);
      savePreferredVoiceURI(uri);
      
      // Preview new voice
      let newVoice: VoiceOption | SpeechSynthesisVoice | null = null;
      if (uri === GOOGLE_VOICE_URI) {
          newVoice = { name: 'Google Translate', voiceURI: GOOGLE_VOICE_URI, lang: 'ru-RU' };
      } else if (uri === YOUDAO_VOICE_URI) {
          newVoice = { name: 'Youdao Dictionary', voiceURI: YOUDAO_VOICE_URI, lang: 'ru-RU' };
      } else if (uri === BAIDU_VOICE_URI) {
          newVoice = { name: 'Baidu TTS', voiceURI: BAIDU_VOICE_URI, lang: 'ru-RU' };
      } else if (uri === SOGOU_VOICE_URI) {
          newVoice = { name: 'Sogou TTS', voiceURI: SOGOU_VOICE_URI, lang: 'ru-RU' };
      } else {
          newVoice = voices.find(v => v.voiceURI === uri) || null;
      }
      
      speakRussian("Проверка звука", newVoice, speechRate, gender);
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRate = parseFloat(e.target.value);
      setSpeechRate(newRate);
      savePreferredRate(newRate);
  };

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

  const handleInsertStress = () => {
    if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newText = editText.slice(0, start) + '\u0301' + editText.slice(end);
        setEditText(newText);
        
        // Restore focus and move cursor after the stress mark
        setTimeout(() => {
            if(textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + 1, start + 1);
            }
        }, 0);
    }
  };

  const handleQuestionSelect = (id: number) => {
      const q = questions.find(q => q.id === id);
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
            questions={questions}
            currentId={currentQuestion.id}
            onSelect={handleQuestionSelect}
            onClose={() => setShowList(false)}
        />
      )}
      
      {showSaveManager && (
          <SaveManager onClose={() => setShowSaveManager(false)} />
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
                    onClick={() => setShowSaveManager(true)}
                    className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-full transition-all"
                    title="存档管理"
                >
                    <Settings size={20} />
                </button>
            </div>
          </div>
          
          <ProgressBar history={history} questions={questions} />
          
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
                                    ref={textareaRef}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] text-lg font-medium"
                                    placeholder="输入你的回答..."
                                />
                                <div className="flex justify-between items-center">
                                    <button 
                                        onClick={handleInsertStress}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded hover:bg-gray-200 text-sm font-serif"
                                        title="在光标处插入重音符号"
                                    >
                                        <Highlighter size={14} /> 插入重音 ( ́ )
                                    </button>
                                    <div className="flex gap-2">
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
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleNext('fail')}
                    className="flex-1 py-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-bold text-lg transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <XCircle size={20} />
                    <span className="text-xs font-normal">没反应过来</span>
                  </button>

                  <button
                    onClick={() => handleNext('hesitant')}
                    className="flex-1 py-4 bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 rounded-xl font-bold text-lg transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <AlertTriangle size={20} />
                    <span className="text-xs font-normal">不熟练/想了一会</span>
                  </button>

                  <button
                    onClick={() => handleNext('perfect')}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <CheckCircle size={20} />
                    <span className="text-xs font-normal text-emerald-100">熟练/反应快</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer controls */}
        <footer className="flex flex-col gap-3 py-4 border-t border-gray-100 w-full max-w-md mx-auto">
            {/* Voice Selection */}
            <div className="flex items-center gap-2 text-sm text-gray-600 w-full px-4">
                <Mic size={16} className="text-gray-400 shrink-0" />
                <span className="shrink-0 w-10">发音</span>
                <select 
                    value={selectedVoiceURI} 
                    onChange={handleVoiceChange}
                    className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none truncate"
                >
                    {/* Show browser voices if available */}
                    {voices.length > 0 && (
                        <optgroup label="本地/系统语音 (推荐)">
                            {voices.map(v => (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                    {v.name}
                                </option>
                            ))}
                        </optgroup>
                    )}
                    
                    <optgroup label="在线备用源">
                        <option value={GOOGLE_VOICE_URI}>Google (Online)</option>
                        <option value={YOUDAO_VOICE_URI}>有道 (Online)</option>
                        <option value={SOGOU_VOICE_URI}>搜狗 (Online)</option>
                        <option value={BAIDU_VOICE_URI}>百度 (Online)</option>
                    </optgroup>
                </select>
            </div>
            
            {/* Speech Rate Selection */}
            <div className="flex items-center gap-2 text-sm text-gray-600 w-full px-4">
                <Gauge size={16} className="text-gray-400 shrink-0" />
                <span className="shrink-0 w-10">语速</span>
                <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1" 
                    value={speechRate}
                    onChange={handleRateChange}
                    className="flex-1 accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="shrink-0 w-8 text-right font-mono text-xs">{speechRate.toFixed(1)}x</span>
            </div>

             {/* Gender Selection */}
             <div className="flex items-center gap-2 text-sm text-gray-600 w-full px-4">
                <User size={16} className="text-gray-400 shrink-0" />
                <span className="shrink-0 w-10">性别</span>
                <div className="flex bg-gray-200 rounded-lg p-0.5">
                    <button
                        onClick={() => { setGender('M'); savePreferredGender('M'); }}
                        className={`px-3 py-0.5 rounded-md text-xs font-medium transition-all ${gender === 'M' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        男 (M)
                    </button>
                    <button
                        onClick={() => { setGender('F'); savePreferredGender('F'); }}
                        className={`px-3 py-0.5 rounded-md text-xs font-medium transition-all ${gender === 'F' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        女 (F)
                    </button>
                </div>
            </div>

            <div className="flex justify-center mt-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        checked={autoPlay} 
                        onChange={(e) => setAutoPlay(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    自动播放问题读音
                </label>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;