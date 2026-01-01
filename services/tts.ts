let currentAudio: HTMLAudioElement | null = null;

// A custom interface to handle both browser voices and our custom online voice
export interface VoiceOption {
  name: string;
  voiceURI: string;
  lang: string;
}

export const GOOGLE_VOICE_URI = 'online-google';
export const YOUDAO_VOICE_URI = 'online-youdao';
export const BAIDU_VOICE_URI = 'online-baidu';

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

  const voiceURI = selectedVoice ? selectedVoice.voiceURI : null;

  // 3. Handle Online Voices
  let url = '';

  if (voiceURI === GOOGLE_VOICE_URI) {
      // Google Translate (Unofficial) - High quality, needs VPN in China
      url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ru&client=tw-ob`;
  } else if (voiceURI === YOUDAO_VOICE_URI) {
      // Youdao Dictionary - Good quality, works in China
      url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ru`;
  } else if (voiceURI === BAIDU_VOICE_URI) {
      // Baidu Translate - Backup for China
      // cuid=baike is a common public client ID used for this endpoint
      url = `https://tts.baidu.com/text2audio?cuid=baike&lan=ru&ctp=1&pdt=301&vol=9&rate=32&per=0&tex=${encodeURIComponent(text)}`;
  }

  if (url) {
    try {
      currentAudio = new Audio(url);
      
      // Note: HTML5 Audio playbackRate works for some codecs/browsers but isn't guaranteed for all streams
      // Google and Youdao streams usually support it in modern browsers.
      currentAudio.playbackRate = rate; 
      
      currentAudio.play().catch(e => {
        console.error(`Playback failed for ${voiceURI}`, e);
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
  
  // Check if the selected voice is a real browser voice (not one of our custom online URIs)
  const isOnlineVoice = [GOOGLE_VOICE_URI, YOUDAO_VOICE_URI, BAIDU_VOICE_URI].includes(voiceURI || '');
  
  if (selectedVoice && !isOnlineVoice) {
    // It's a real browser voice object
    utterance.voice = selectedVoice as SpeechSynthesisVoice;
  } else {
    // Auto-detect a Russian voice if none specified or if falling back from online failure
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