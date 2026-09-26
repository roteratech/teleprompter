/**
 * Camera Preview & MediaRecorder Service
 * Captures live webcam with audio mixing for studio takes.
 */

export class CameraRecordingService {
  constructor(videoElement = null) {
    this.videoEl = videoElement;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.activeDeviceId = null;
    this.startTime = 0;
    this.timerInterval = null;
    this.onTimerUpdate = null;
    this.latestBlob = null;
  }

  setVideoElement(el) {
    this.videoEl = el;
    if (this.mediaStream && this.videoEl) {
      this.videoEl.srcObject = this.mediaStream;
    }
  }

  async startPreview(preferredDeviceId = null) {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        // Preview audio set to false so speech recognition hardware is not locked on mobile
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoEl) {
        this.videoEl.srcObject = this.mediaStream;
      }
      this.activeDeviceId = preferredDeviceId;
      return this.mediaStream;
    } catch (err) {
      console.warn("Camera preview acquisition failed:", err);
      return null;
    }
  }

  stopPreview() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  async startRecording() {
    if (!this.mediaStream) {
      const stream = await this.startPreview(this.activeDeviceId);
      if (!stream) return false;
    }

    // Attach microphone track for the recording if missing
    if (this.mediaStream.getAudioTracks().length === 0) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach(track => this.mediaStream.addTrack(track));
      } catch (e) {
        console.warn("Recording without microphone track:", e);
      }
    }

    this.recordedChunks = [];

    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      } else {
        delete options.mimeType;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;
      this.startTime = Date.now();

      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.onTimerUpdate) this.onTimerUpdate(elapsed);
      }, 1000);

      return true;
    } catch (err) {
      console.error("Recording start error:", err);
      return false;
    }
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      clearInterval(this.timerInterval);
      this.isRecording = false;

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'video/webm';
        this.latestBlob = new Blob(this.recordedChunks, { type: mimeType });
        resolve(this.latestBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async enumerateCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch (e) {
      return [];
    }
  }
}
