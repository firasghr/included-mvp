import OpenAI from 'openai';

/**
 * Process input text with OpenAI GPT-4o-mini to generate professional summaries
 * @param input - The input text (email or document) to summarize
 * @returns Summarized text or error message
 */
export async function processWithLLM(input: string): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({
      apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional assistant that creates clear, concise summaries of emails and documents. Provide accurate summaries that capture the key points and action items.',
        },
        {
          role: 'user',
          content: `Please summarize the following text:\n\n${input}`,
        },
      ],
      temperature: 0.2,
    });

    const summary = completion.choices[0]?.message?.content;
    
    if (!summary) {
      throw new Error('No summary generated from OpenAI');
    }

    return summary;
  } catch (error) {
    console.error('Error processing input with LLM:', error);
    return 'Error processing input.';
  }
}
