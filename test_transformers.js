import { pipeline } from '@huggingface/transformers';

async function main() {
  console.log('Loading model...');
  const generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
  console.log('Model loaded.');

  const vegetableName = 'Turnip';
  const tones = ['normal', 'funny', 'professional'];

  const prompts = [
    (tone) => `describe the vegetable ${vegetableName} with a ${tone} tone in 1 sentence:`,
    (tone) => `Write one sentence describing the vegetable ${vegetableName} in a ${tone} tone.`,
    (tone) => `Provide a single fact about the vegetable ${vegetableName}. Tone: ${tone}.`,
    (tone) => `Write a short, ${tone} sentence about ${vegetableName}.`
  ];

  for (const getPrompt of prompts) {
    for (const tone of tones) {
      const prompt = getPrompt(tone);
      const result = await generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      });
      console.log(`Prompt: "${prompt}"`);
      console.log(`Output: ${result[0].generated_text}\n`);
    }
  }
}

main().catch(console.error);
