/**
 * Audio VAD (Voice Activity Detection) Engine
 * With noise floor calibration, hysteresis gating, and Android microphone AEC protection.
 */

export class AudioVADEngine {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.dataArray = null;
    this.isListening = false;
    this.currentRms = 0;
    this.isSpeaking = false;
    this.threshold = 0.18; // normalized slider value (0.05 to 0.6)
    this.noiseFloor = 0.015;
    this.isCalibrating = false;
    this._calibrationSamples = [];
    this._calibrationStartedAt = 0;
    this._calibrationDurationMs = 600;
    this.listeners = new Set();
    this.rafId = null;
  }

  async start(stream = null) {
    try {
      // NOTE: Disable echoCancellation to avoid Android Chrome hijacking the built-in mic
      // away from the Web Speech API recognizer.
      this.mediaStream = stream || await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      this.sourceNode.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;

      // Calibration phase to detect ambient room noise floor
      this.isCalibrating = true;
      this._calibrationSamples = [];
      this._calibrationStartedAt = performance.now();

      this._processAudioLoop();
      return true;
    } catch (err) {
      console.warn("Microphone access failed or denied:", err);
      return false;
    }
  }

  stop() {
    this.isListening = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (e) {}
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  setThreshold(normalizedPercent) {
    this.threshold = Math.max(0.02, Math.min(0.8, normalizedPercent / 100));
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _emit(speaking, rms, calibrating = false) {
    this.listeners.forEach(cb => cb({ isSpeaking: speaking, rms, calibrating }));
  }

  _processAudioLoop() {
    if (!this.isListening || !this.analyser) return;

    this.analyser.getByteTimeDomainData(this.dataArray);

    let sumSquares = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const norm = (this.dataArray[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    this.currentRms = Math.sqrt(sumSquares / this.dataArray.length);

    if (this.isCalibrating) {
      this._calibrationSamples.push(this.currentRms);
      if (performance.now() - this._calibrationStartedAt >= this._calibrationDurationMs) {
        const sorted = [...this._calibrationSamples].sort((a, b) => a - b);
        const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0];
        this.noiseFloor = Math.min(0.2, p25);
        this.isCalibrating = false;
      }
      this._emit(false, this.currentRms, true);
      this.rafId = requestAnimationFrame(() => this._processAudioLoop());
      return;
    }

    const sensitivityMargin = Math.max(0.008, 0.01 + this.threshold * 0.11);
    const startThreshold = this.noiseFloor + sensitivityMargin;
    const stopThreshold = this.noiseFloor + sensitivityMargin * 0.55;

    if (this.currentRms > startThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this._emit(true, this.currentRms, false);
      } else {
        this._emit(true, this.currentRms, false);
      }
    } else if (this.currentRms < stopThreshold) {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        this._emit(false, this.currentRms, false);
      } else {
        this._emit(false, this.currentRms, false);
      }
    } else {
      this._emit(this.isSpeaking, this.currentRms, false);
    }

    this.rafId = requestAnimationFrame(() => this._processAudioLoop());
  }
}
