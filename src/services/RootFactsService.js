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
        'Xenova/LaMini-Flan-T5-77M',
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
      const MAX_THEME_LENGTH = 30;
      let sanitizedName = (vegetableName || '')
        .replace(/[|]{2,}/g, '')
        .replace(/[#=]{2,}/g, '')
        .replace(/(--|\+\+|``)/g, '')
        .replace(/\n/g, ' ')
        .trim();

      if (!sanitizedName || sanitizedName.length > MAX_THEME_LENGTH) {
        sanitizedName = 'vegetable';
      }

      let prompt = `Describe vegetable ${sanitizedName} in a ${this.currentTone} way with one sentence, focusing on its health benefits or nutritional value for the human body.`;

      const result = await this.generator(prompt, {
        max_new_tokens: 150,
        temperature: 0.8,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.2
      });

      const generatedFact = result[0]?.generated_text || 'No fact generated.';
      // Menyambungkan teks generatif secara langsung dengan nama buah/sayur yang ditebak
      return `${generatedFact}`;
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
