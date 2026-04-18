import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set in environment variables");
}

export const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey || "",
});

export const MODEL_NAME = "google/gemini-2.0-flash-lite-preview-02-05:free";
