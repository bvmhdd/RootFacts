import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  async loadModel(onProgress) {
    // Force WebAssembly (wasm) for Transformers.js instead of WebGPU
    // WebGPU shader compilation for T5 decoders can freeze the browser on some devices.
    this.currentBackend = 'wasm';
    env.backends.onnx.wasm.numThreads = 1; // FIX: Prevent SharedArrayBuffer crash on Netlify
    console.log('Transformers.js menggunakan WebAssembly');
    
    // Pastikan env cache dimatikan jika error offline
    // env.allowLocalModels = false;

    try {
      this.generator = await pipeline(
        'text2text-generation',
        'Xenova/flan-t5-small',
        {
          device: this.currentBackend,
          dtype: 'q4',
          progress_callback: (info) => {
            if (onProgress) onProgress(info);
          }
        }
      );
      this.isModelLoaded = true;
    } catch (err) {
      console.error('Gagal memuat model Generative AI:', err);
      throw err;
    }
  }

  setTone(tone) {
    if (TONE_CONFIG.availableTones.find((t) => t.value === tone)) {
      this.currentTone = tone;
    }
  }

  async generateFacts(vegetableName) {
    if (!this.generator || this.isGenerating) return null;
    this.isGenerating = true;

    try {
      let prompt = `Share a super interesting and surprising fun fact about ${vegetableName}:`;

      switch (this.currentTone) {
      case 'funny':
        prompt = `Tell a hilarious, laugh-out-loud joke or very funny fact about ${vegetableName}:`;
        break;
      case 'professional':
        prompt = `Provide a detailed scientific, nutritional, and botanical fact about ${vegetableName}:`;
        break;
      case 'child':
        prompt = `Explain a magical and super fun fact about ${vegetableName} for a 5 year old kid:`;
        break;
      default:
        prompt = `Share a super interesting, mind-blowing, and surprising fun fact about ${vegetableName}:`;
      }

      const result = await this.generator(prompt, {
        max_new_tokens: 200,
        temperature: 0.9,
        top_p: 0.95,
        do_sample: true
      });

      return result[0]?.generated_text || 'No fact generated.';
    } catch (err) {
      console.error('Gagal menghasilkan fakta:', err);
      throw err;
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}
