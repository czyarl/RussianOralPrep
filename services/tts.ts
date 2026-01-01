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
export const SOGOU_VOICE_URI = 'online-sogou';

export const speakRussian = async (
    text: string, 
    selectedVoice: VoiceOption | SpeechSynthesisVoice | null = null, 
    rate: number = 0.9,
    genderPreference: 'M' | 'F' = 'M' 
) => {
  // 1. Cancel any ongoing browser speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 2. Cancel any ongoing audio element playback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = ""; // Detach source
    currentAudio = null;
  }

  if (!text) return;

  const voiceURI = selectedVoice ? selectedVoice.voiceURI : null;

  // --- STANDARD ONLINE TTS URLS (FALLBACKS) ---
  let url = '';

  if (voiceURI === GOOGLE_VOICE_URI) {
      url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ru&client=tw-ob`;
  } else if (voiceURI === YOUDAO_VOICE_URI) {
      url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ru`;
  } else if (voiceURI === BAIDU_VOICE_URI) {
      url = `https://fanyi.baidu.com/gettts?lan=ru&text=${encodeURIComponent(text)}&spd=3&source=web`;
  } else if (voiceURI === SOGOU_VOICE_URI) {
      url = `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(text)}&speed=1&lang=ru&from=translateweb&speaker=6`;
  }

  // If it's an online URL voice
  if (url) {
    try {
      const audio = new Audio(url);
      currentAudio = audio;
      audio.playbackRate = rate; 
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
            if (e.name === 'AbortError') return;
            console.warn(`Online playback failed for ${voiceURI}, trying browser fallback.`, e);
            // Fallback to browser synthesis if URL fails
            speakBrowserNative(text, rate);
        });
      }
    } catch (e) {
      console.error("Error setting up audio", e);
    }
    return;
  }

  // --- BROWSER NATIVE SYNTHESIS (PRIMARY) ---
  speakBrowserNative(text, rate, selectedVoice as SpeechSynthesisVoice);
};

// Helper for browser native speech
const speakBrowserNative = (text: string, rate: number, preferredVoice?: SpeechSynthesisVoice) => {
    if (!window.speechSynthesis) {
        console.warn("Speech synthesis not supported");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = rate; 
    utterance.pitch = 1;

    // Use preferred voice if provided and it's not a custom online object
    if (preferredVoice && preferredVoice.voiceURI && !preferredVoice.voiceURI.startsWith('online-')) {
        utterance.voice = preferredVoice;
    } else {
        // Auto-select best available Russian voice
        const voices = window.speechSynthesis.getVoices();
        const ruVoices = voices.filter(v => v.lang.toLowerCase().includes('ru'));
        
        // Prioritize "Google" or "Microsoft" voices (usually higher quality)
        const bestVoice = ruVoices.find(v => v.name.includes('Google')) || 
                          ruVoices.find(v => v.name.includes('Microsoft')) || 
                          ruVoices[0];
                          
        if (bestVoice) {
            utterance.voice = bestVoice;
        }
    }

    window.speechSynthesis.speak(utterance);
}