import { pipeline } from '@huggingface/transformers';

async function main() {
  const generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
  
  const vegetables = ['Turnip', 'Corn', 'Tomato', 'Carrot', 'Potato'];
  const tones = ['normal', 'funny', 'professional'];
  
  for (const veg of vegetables) {
    for (const tone of tones) {
      const prompt = `Write exactly one sentence describing the vegetable ${veg} in a ${tone} tone.`;
      
      const res1 = await generator(prompt, {
        max_new_tokens: 50,
        do_sample: false
      });
      
      const res2 = await generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.5,
        top_p: 0.9,
        do_sample: true
      });

      console.log(`[${veg}] [${tone}] (Greedy) -> ${res1[0].generated_text}`);
      console.log(`[${veg}] [${tone}] (Sample) -> ${res2[0].generated_text}`);
    }
    console.log('---');
  }
}

main().catch(console.error);
