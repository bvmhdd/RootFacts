import { pipeline } from '@huggingface/transformers';

async function main() {
  const generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
  const vegetableName = 'Turnip';
  
  const prompts = [
    `Describe the vegetable ${vegetableName}.`,
    `What is a ${vegetableName}?`,
    `Write a fact about ${vegetableName}:`,
    `Answer this: what is a ${vegetableName}?`,
    `Translate to English: deskripsikan sayuran ${vegetableName} dengan kalimat yang normal dalam 1 kalimat`,
    `A short description of a ${vegetableName} is that`,
    `Write exactly one sentence describing the vegetable ${vegetableName} in a normal tone.`,
    `Can you describe the vegetable ${vegetableName}?`
  ];

  for (const prompt of prompts) {
      const result = await generator(prompt, {
        max_new_tokens: 30,
        temperature: 0.5,
        top_p: 0.9,
        do_sample: true
      });
      console.log(`Prompt: "${prompt}"`);
      console.log(`Output: ${result[0].generated_text}\n`);
  }
}

main().catch(console.error);
