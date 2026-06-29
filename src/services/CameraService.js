export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = { fps: 10 };
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  async loadCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  async startCamera(selectedCameraId) {
    let videoConstraints = { facingMode: 'environment' };
    if (selectedCameraId === 'front') {
      videoConstraints = { facingMode: 'user' };
    } else if (selectedCameraId && selectedCameraId !== 'default') {
      videoConstraints = { deviceId: { exact: selectedCameraId } };
    }

    const constraints = {
      video: videoConstraints
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = this.stream;
        await new Promise((resolve) => {
          this.video.onloadedmetadata = () => {
            this.video.play();
            resolve();
          };
        });
      }
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      throw err;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    this.config.fps = fps;
  }

  isActive() {
    return this.stream !== null && this.stream.active;
  }

  isReady() {
    return this.video !== null && this.video.readyState >= 2;
  }
}