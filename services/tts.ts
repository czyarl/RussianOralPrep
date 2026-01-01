let currentAudio: HTMLAudioElement | null = null;

// A custom interface to handle both browser voices and our custom online voice
export interface VoiceOption {
  name: string;
  voiceURI: string;
  lang: string;
}

export const GOOGLE_VOICE_URI = 'online-google-translate';

export const speakRussian = (text: string, selectedVoice: VoiceOption | SpeechSynthesisVoice | null = null, rate: number = 0.9) => {
  // 1. Cancel any ongoing browser speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 2. Cancel any ongoing audio playback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (!text) return;

  // 3. Check if it's the Google Translate Online voice
  if (selectedVoice && selectedVoice.voiceURI === GOOGLE_VOICE_URI) {
    try {
      // Use the unofficial Google Translate TTS endpoint
      // client=tw-ob is a common client ID used for this hack
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ru&client=tw-ob`;
      
      currentAudio = new Audio(url);
      currentAudio.playbackRate = rate; // HTML5 Audio supports playback rate
      
      currentAudio.play().catch(e => {
        console.error("Google TTS playback failed (likely network or CORS)", e);
        // Fallback or alert could go here, but silent fail + console log is standard for this hack
      });
    } catch (e) {
      console.error("Error setting up audio", e);
    }
    return;
  }

  // 4. Fallback to Browser Native SpeechSynthesis
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (selectedVoice && selectedVoice.voiceURI !== GOOGLE_VOICE_URI) {
    // It's a real browser voice object
    utterance.voice = selectedVoice as SpeechSynthesisVoice;
  } else {
    // Auto-detect a Russian voice if none specified
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.toLowerCase().includes('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }
  }
  
  utterance.lang = 'ru-RU';
  utterance.rate = rate; 
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
};