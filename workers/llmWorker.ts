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
    GPT-5 Mini Integration
    - Summarizes emails, documents, or notes clearly and concisely
    - Temperature 0.2 for professional, deterministic outputs
    - Handles errors gracefully
    - Returns clean text for automation or report generation
  */
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
You are a professional AI assistant for SMBs.
Your task:
1. Summarize emails, documents, and notes clearly and concisely.
2. Keep the output factual and professional.
3. No unnecessary commentary or filler text.
4. Output must be ready to include in reports or automation.
          `
        },
        { role: "user", content: input }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content;
    return content || "Error processing input.";
  } catch (err) {
    console.error("LLM error:", err);
    return "Error processing input.";
  }
}
