import { HfInference } from "@huggingface/inference";

const MODEL_NAME = process.env.HF_MODEL || "google/flan-t5-small";
const HF_API_KEYS = [
  process.env.HF_API_KEY1,
  process.env.HF_API_KEY2,
  process.env.HF_API_KEY3
].filter(Boolean);

let currentKeyIndex = 0;
const createHF = (key) => new HfInference(key);
let hf = HF_API_KEYS.length ? createHF(HF_API_KEYS[currentKeyIndex]) : null;

function mockReply(messages) {
  const last = messages && messages.length ? (messages[messages.length - 1].content || messages[messages.length - 1].text || "") : "";
  return `Demo reply (no AI available). You said: "${String(last).slice(0, 150)}" — configure a valid HF API key to get real AI replies.`;
}

export async function chatWithHF(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No messages provided";
  }

  const prompt = messages.map(m => `${m.role || "user"}: ${m.content || m.text || ""}`).join("\n") + "\nassistant:";

  if (!hf) {
    console.warn("No HF API keys configured — returning mock reply.");
    return mockReply(messages);
  }

  const maxAttempts = Math.max(1, HF_API_KEYS.length);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`HF: using key index ${currentKeyIndex} (attempt ${attempt + 1}/${maxAttempts}), model=${MODEL_NAME}`);
      const resp = await hf.textGeneration({
        model: MODEL_NAME,
        inputs: prompt,
        max_new_tokens: Number(process.env.HF_MAX_TOKENS) || 150,
        temperature: Number(process.env.HF_TEMPERATURE) || 0.7,
      });

      const reply = resp?.generated_text || resp?.data?.[0]?.generated_text || resp?.[0]?.generated_text;
      if (reply && String(reply).trim()) return String(reply).trim();
      throw new Error("Empty reply from HF");
    } catch (err) {
      const message = String(err?.message || err).toLowerCase();
      console.error("HuggingFace error:", message);

      if (message.includes("exceeded") || message.includes("credits") || message.includes("quota")) {
        return "All AI tokens exhausted or invalid. Please check your Hugging Face account/quota.";
      }

      if ((message.includes("invalid") || message.includes("401") || message.includes("unauthorized")) && HF_API_KEYS.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % HF_API_KEYS.length;
        hf = createHF(HF_API_KEYS[currentKeyIndex]);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      if (HF_API_KEYS.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % HF_API_KEYS.length;
        hf = createHF(HF_API_KEYS[currentKeyIndex]);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      if (attempt === maxAttempts - 1) {
        console.error("HF: all attempts failed, returning mock reply.");
        return mockReply(messages);
      }
    }
  }

  return mockReply(messages);
}

export default chatWithHF;
