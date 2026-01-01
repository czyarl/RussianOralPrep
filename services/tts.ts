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

export const speakRussian = (text: string, selectedVoice: VoiceOption | SpeechSynthesisVoice | null = null, rate: number = 0.9) => {
  // 1. Cancel any ongoing browser speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 2. Cancel any ongoing audio playback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = ""; // Detach source
    currentAudio = null;
  }

  if (!text) return;

  const voiceURI = selectedVoice ? selectedVoice.voiceURI : null;

  // 3. Handle Online Voices
  let url = '';

  if (voiceURI === GOOGLE_VOICE_URI) {
      // Google Translate (Unofficial)
      // Added client=tw-ob. With <meta name="referrer" content="no-referrer"> in index.html, this works much better.
      url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ru&client=tw-ob`;
  } else if (voiceURI === YOUDAO_VOICE_URI) {
      // Youdao Dictionary - Requires no-referrer
      url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ru`;
  } else if (voiceURI === BAIDU_VOICE_URI) {
      // Baidu Fanyi API - More stable than tts.baidu.com
      // spd = speed (3 is normal), source = web
      url = `https://fanyi.baidu.com/gettts?lan=ru&text=${encodeURIComponent(text)}&spd=3&source=web`;
  } else if (voiceURI === SOGOU_VOICE_URI) {
      // Sogou Translate - Excellent quality, works well in China
      // from=translateweb, speaker=6 (Russian voice)
      url = `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(text)}&speed=1&lang=ru&from=translateweb&speaker=6`;
  }

  if (url) {
    try {
      const audio = new Audio(url);
      currentAudio = audio;
      
      // Attempt to set rate, though not all endpoints/browsers support it for remote streams
      audio.playbackRate = rate; 
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
            // Ignore AbortError which happens when skipping quickly
            if (e.name === 'AbortError') return;
            console.error(`Playback failed for ${voiceURI}`, e);
        });
      }
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
  const isOnlineVoice = [GOOGLE_VOICE_URI, YOUDAO_VOICE_URI, BAIDU_VOICE_URI, SOGOU_VOICE_URI].includes(voiceURI || '');
  
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