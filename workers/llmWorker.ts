import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiInstance = new OpenAI({
      apiKey,
      timeout: 30000, // 30 second timeout
    });
  }

  return openaiInstance;
}

/**
 * Process text with LLM (OpenAI GPT-5 Mini) with retry logic
 * @param input - The text to process
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Processed summary text
 */
export async function processWithLLM(input: string, maxRetries: number = 3): Promise<string> {
  /*
    GPT-5 Mini Professional Summarizer Worker

    PURPOSE:
    - Convert business emails, notes, or documents into concise summaries
    - Used for automation pipelines and daily reports

    STRICT OUTPUT REQUIREMENTS:
    - Output ONLY the summary
    - 1–2 sentences maximum
    - Professional and factual tone
    - No advice
    - No templates
    - No assistant commentary
    - No questions
    - No explanations
  */

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`LLM processing attempt ${attempt}/${maxRetries}`);
      
      const openai = getOpenAI();

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a professional SMB operations summarization engine.

Your ONLY job is to summarize business communications.

STRICT RULES:

- Output ONLY the summary
- Maximum 2 sentences
- Professional tone
- Factual only
- No advice
- No templates
- No explanations
- No assistant-style responses
- No questions
- No extra text

GOOD OUTPUT EXAMPLE:
"Client received the Q1 report and was asked to provide feedback."

BAD OUTPUT EXAMPLE:
"I can summarize this..."
"Please provide..."
"Here is a template..."
            `
          },
          {
            role: "user",
            content: input
          }
        ],
      });

      const content = response.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      console.log(`LLM processing successful on attempt ${attempt}`);
      return content;

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`LLM error on attempt ${attempt}/${maxRetries}:`, lastError.message);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`LLM processing failed after ${maxRetries} attempts:`, lastError?.message);
  return "Error processing input.";
}
