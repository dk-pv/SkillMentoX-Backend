import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

const MODEL = "gemini-1.5-flash";

async function getToken() {
  const auth = new GoogleAuth({
    keyFile:  process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}


export async function chatWithGemini(messages = []) {
  const prompt = messages.map(m => `${m.role || "user"}: ${m.content || m.text}`).join("\n") + "\nassistant:";

  const accessToken = await getToken();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t generate a response.";
}
