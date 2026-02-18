import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiInstance = new OpenAI({
      apiKey
    });
  }

  return openaiInstance;
}

export async function processWithLLM(input: string): Promise<string> {
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

  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
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
      ]
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return "Error processing input.";
    }

    return content;
  } catch (err) {
    console.error("LLM error:", err);
    return "Error processing input.";
  }
}
