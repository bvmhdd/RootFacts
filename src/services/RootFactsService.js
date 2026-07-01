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
      let prompt = `Provide a detailed description and interesting fact about the vegetable ${vegetableName} with a ${this.currentTone} tone in 2 sentences.`;

      const result = await this.generator(prompt, {
        max_new_tokens: 150,
        temperature: 0.3,
        do_sample: false,
        repetition_penalty: 1.2
      });

      const generatedFact = result[0]?.generated_text || 'No fact generated.';
      // Menyambungkan teks generatif secara langsung dengan nama buah/sayur yang ditebak
      return `Fakta tentang ${vegetableName}: ${generatedFact}`;
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
