/**
 * Speech Recognition Service
 * Wraps browser Web Speech API (webkitSpeechRecognition) with cumulative alignment,
 * robust restart mechanisms for mobile, and Turkish/Azerbaijani language handling.
 */

import { cleanAndTokenize } from '../utils/textMatcher';

export class SpeechEngine {
  constructor(language = 'tr-TR') {
    this.language = language;
    this.recognition = null;
    this.isRecognizing = false;
    this.isSpeaking = false;
    this._speakingTimeout = null;
    this._restartTimer = null;
    this._restartAttempts = 0;
    this._finalAccumulated = '';

    this.onSpeechPhrase = null;
    this.onTokensMatched = null;
    this.onInterimTranscript = null;
    this.onSpeechActivity = null;
    this.onError = null;
  }

  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  initialize() {
    if (!this.isSupported()) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return false;
    }

    const SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecClass();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = this.language;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const setSpeaking = (speaking) => {
      if (this._speakingTimeout) {
        clearTimeout(this._speakingTimeout);
        this._speakingTimeout = null;
      }
      if (speaking) {
        this.isSpeaking = true;
        if (this.onSpeechActivity) this.onSpeechActivity(true);
        // Fast pause detection: 550ms silence stops speaking status
        this._speakingTimeout = setTimeout(() => {
          this.isSpeaking = false;
          if (this.onSpeechActivity) this.onSpeechActivity(false);
          this._speakingTimeout = null;
        }, 550);
      } else {
        this._speakingTimeout = setTimeout(() => {
          this.isSpeaking = false;
          if (this.onSpeechActivity) this.onSpeechActivity(false);
          this._speakingTimeout = null;
        }, 400);
      }
    };

    this.recognition.onstart = () => {
      this.isRecognizing = true;
      this._restartAttempts = 0;
    };

    this.recognition.onspeechstart = () => setSpeaking(true);
    this.recognition.onsoundstart = () => setSpeaking(true);
    this.recognition.onspeechend = () => setSpeaking(false);
    this.recognition.onsoundend = () => setSpeaking(false);

    this.recognition.onresult = (event) => {
      setSpeaking(true);

      let latestInterim = '';
      let latestFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (!r || !r.length) continue;
        let best = r[0].transcript || '';
        for (let a = 1; a < r.length; a++) {
          if (r[a] && r[a].confidence && r[0].confidence && r[a].confidence > r[0].confidence) {
            best = r[a].transcript;
          }
        }

        const trimmed = best.trim();
        if (!trimmed) continue;

        if (r.isFinal) {
          latestFinal = trimmed;
        } else {
          latestInterim = trimmed;
        }

        // Deliver clean, isolated phrase event
        if (this.onSpeechPhrase) {
          this.onSpeechPhrase({
            resultIndex: i,
            transcript: trimmed,
            isFinal: Boolean(r.isFinal),
            words: cleanAndTokenize(trimmed)
          });
        }
      }

      const currentLive = (latestInterim || latestFinal).trim();
      if (this.onInterimTranscript && currentLive) {
        this.onInterimTranscript(currentLive);
      }

      if (latestFinal) this._finalAccumulated += latestFinal + ' ';
      const fullContext = (this._finalAccumulated + ' ' + latestInterim).trim();
      if (fullContext && this.onTokensMatched) {
        const tokens = cleanAndTokenize(fullContext);
        this.onTokensMatched(tokens, !latestInterim, fullContext);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isRecognizing = false;
      }
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      if (!this.isRecognizing) return;
      if (this._restartTimer) clearTimeout(this._restartTimer);
      const delay = isMobile ? 250 : 120;
      this._restartTimer = setTimeout(() => {
        if (!this.isRecognizing) return;
        try {
          this.recognition.start();
          this._restartAttempts = 0;
        } catch (e) {
          this._restartAttempts = (this._restartAttempts || 0) + 1;
          if (this._restartAttempts < 6) {
            setTimeout(() => {
              if (this.isRecognizing) {
                try { this.recognition.start(); } catch (e2) {}
              }
            }, 400);
          }
        }
      }, delay);
    };

    return true;
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
      if (this.isRecognizing) {
        this.stop();
        this.start();
      }
    }
  }

  start() {
    if (!this.recognition) {
      if (!this.initialize()) return false;
    }
    try {
      this.isRecognizing = true;
      this._finalAccumulated = '';
      this.recognition.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  stop() {
    this.isRecognizing = false;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }
    if (this._speakingTimeout) {
      clearTimeout(this._speakingTimeout);
      this._speakingTimeout = null;
    }
    this.isSpeaking = false;
    this._finalAccumulated = '';
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }
}
