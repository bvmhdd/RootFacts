import { pipeline } from '@huggingface/transformers';

async function main() {
  const generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
  
  const vegetables = ['Turnip', 'Corn', 'Tomato', 'Carrot', 'Potato'];
  const tones = ['normal', 'funny', 'professional', 'casual'];
  
  for (const veg of vegetables) {
    for (const tone of tones) {
      const prompt = `describe the vegetable ${veg} with a ${tone} tone in 1 sentence`;
      const result = await generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.3,
        top_p: 0.9,
        do_sample: false
      });
      console.log(`[${veg}] [${tone}] -> ${result[0].generated_text}`);
    }
  }
}

main().catch(console.error);
