import dotenv from "dotenv";
dotenv.config(); // <-- this loads .env variables
import { processWithLLM } from "./workers/llmWorker";
(async () => {
    const summary = await processWithLLM("This is a test email. Please summarize it for a professional report.");
    console.log("LLM Output:", summary);
})();
