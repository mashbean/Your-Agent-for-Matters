import { assertImageProvider, assertStructuredProvider, assertTextProvider } from "../../providers-contracts/src/index.mjs";

export function createOpenAIProvider({
  apiKey,
  textModel = "gpt-5.2",
  imageModel = "gpt-image-1",
  baseUrl = "https://api.openai.com/v1"
} = {}) {
  async function requestJson(url, payload) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is required");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  const provider = {
    async generateText({ prompt }) {
      const payload = await requestJson(`${baseUrl}/responses`, {
        model: textModel,
        input: prompt
      });
      return payload.output_text || "";
    },
    async generateStructured({ prompt, jsonSchema }) {
      const payload = await requestJson(`${baseUrl}/responses`, {
        model: textModel,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "matters_structured_output",
            schema: jsonSchema,
            strict: true
          }
        }
      });
      return JSON.parse(payload.output_text || "{}");
    },
    async generateImage({ prompt, size = "1024x1024" }) {
      const payload = await requestJson(`${baseUrl}/images/generations`, {
        model: imageModel,
        prompt,
        size
      });
      return payload.data?.[0] || null;
    }
  };

  assertTextProvider(provider);
  assertStructuredProvider(provider);
  assertImageProvider(provider);
  return provider;
}
