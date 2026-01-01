export const speakRussian = (text: string) => {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a Russian voice
  const voices = window.speechSynthesis.getVoices();
  const ruVoice = voices.find(v => v.lang.includes('ru'));
  
  if (ruVoice) {
    utterance.voice = ruVoice;
  }
  
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
};
