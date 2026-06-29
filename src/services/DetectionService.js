import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
  }

  async loadModel(onProgress) {
    // Strategy Backend Adaptive
    try {
      if (navigator.gpu) {
        await tf.setBackend('webgpu');
        console.log('Menggunakan WebGPU backend');
      } else {
        await tf.setBackend('webgl');
        console.log('Menggunakan WebGL backend');
      }
      await tf.ready();
    } catch (err) {
      console.warn('Gagal mengatur backend WebGPU/WebGL, fallback ke CPU', err);
      await tf.setBackend('cpu');
    }

    // Load Model and Metadata concurrently
    try {
      const [model, metadata] = await Promise.all([
        tf.loadLayersModel('/model/model.json', {
          onProgress: (fraction) => {
            if (onProgress) onProgress(fraction);
          }
        }),
        fetch('/model/metadata.json').then((res) => res.json())
      ]);

      this.model = model;
      this.labels = metadata.labels;
      this.config = { imageSize: metadata.imageSize };
    } catch (err) {
      console.error('Gagal memuat model/metadata:', err);
      throw err;
    }
  }

  async predict(imageElement) {
    if (!this.model) return null;

    // Use tf.tidy to prevent memory leaks
    return tf.tidy(() => {
      // 1. Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);

      // 2. Resize image if needed
      if (this.config && this.config.imageSize) {
        tensor = tf.image.resizeBilinear(tensor, [this.config.imageSize, this.config.imageSize]);
      }

      // 3. Normalize to [0, 1] usually expected by models
      tensor = tensor.expandDims(0).toFloat().div(tf.scalar(255));

      // 4. Predict
      const prediction = this.model.predict(tensor);

      // 5. Get top result
      const scores = prediction.dataSync();
      const maxScoreIndex = scores.indexOf(Math.max(...scores));
      const confidence = scores[maxScoreIndex] * 100;

      return {
        label: this.labels[maxScoreIndex],
        className: this.labels[maxScoreIndex],
        confidence: confidence,
        score: confidence / 100,
        isValid: true
      };
    });
  }

  isLoaded() {
    return this.model !== null && this.labels.length > 0;
  }
}
