import { openrouter } from "./openrouter";
import OpenAI from "openai";
import AIConfig from "../models/AIConfig";
import { connectDB } from "./mongodb";

export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AIResponse {
    content: string | null;
    raw?: unknown;
    finishReason?: string | null;
    usageMetadata?: unknown;
}

export async function generateAIResponse(
    messages: Message[],
    options: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
        thinkingBudget?: number;
        stopSequences?: string[];
        responseSchema?: unknown;
        response_format?: { type: "json_object" };
        overrideConfig?: {
            provider?: 'openrouter' | 'google';
            apiKey?: string;
            modelName?: string;
        }
    } = {}
): Promise<AIResponse> {
    await connectDB();
    const dbConfig = await AIConfig.findOne({});

    const provider = options.overrideConfig?.provider || dbConfig?.provider || "openrouter";
    const temperature = options.temperature ?? dbConfig?.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? dbConfig?.maxTokens ?? 32000;
    const topP = options.topP ?? dbConfig?.topP ?? undefined;
    const topK = options.topK ?? dbConfig?.topK ?? undefined;
    const thinkingBudget = options.thinkingBudget ?? dbConfig?.thinkingBudget ?? undefined;
    const stopSequences = options.stopSequences ?? (dbConfig?.stopSequences?.length ? dbConfig.stopSequences : undefined);
    const responseSchema = options.responseSchema ?? dbConfig?.responseSchema ?? undefined;

    if (provider === "google") {
        return await callGoogleGemini(messages, {
            apiKey: options.overrideConfig?.apiKey || process.env.GOOGLE_AI_API_KEY || dbConfig?.googleApiKey,
            model: options.overrideConfig?.modelName || dbConfig?.googleModelName || "gemini-2.0-flash",
            temperature,
            maxTokens,
            topP,
            topK,
            thinkingBudget,
            stopSequences,
            responseSchema,
            responseFormat: options.response_format?.type
        });
    } else {
        // Default to OpenRouter
        const apiKey = options.overrideConfig?.apiKey || process.env.OPENROUTER_API_KEY || dbConfig?.apiKey || "";
        const model = options.overrideConfig?.modelName || dbConfig?.modelName || "google/gemini-2.0-flash-lite-preview-02-05:free";
        
        // We'll use a temporary OpenAI instance if an API key is provided, otherwise the default openrouter instance
        const client = apiKey ? new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
        }) : openrouter;

        const completion = await client.chat.completions.create({
            model: model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            stop: stopSequences,
            response_format: options.response_format,
        });

        return {
            content: completion.choices[0].message.content,
            raw: completion
        };
    }
}

async function callGoogleGemini(
    messages: Message[],
    options: {
        apiKey?: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP?: number;
        topK?: number;
        thinkingBudget?: number;
        stopSequences?: string[];
        responseSchema?: unknown;
        responseFormat?: string;
    }
): Promise<AIResponse> {
    if (!options.apiKey) {
        throw new Error("Google API Key is not configured");
    }

    const systemMessage = messages.find(m => m.role === "system")?.content;
    const chatMessages = messages.filter(m => m.role !== "system");

    // Map roles: assistant -> model
    const contents = chatMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
    }));

    const body: any = {
        contents,
        generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
            ...(typeof options.topP === "number" ? { topP: options.topP } : {}),
            ...(typeof options.topK === "number" ? { topK: options.topK } : {}),
            ...(options.stopSequences?.length ? { stopSequences: options.stopSequences } : {}),
        }
    };

    // Preview/thinking Gemini models can spend most of the budget on internal reasoning
    // and then truncate the visible JSON output. Disable thinking for API-style JSON calls.
    if (typeof options.thinkingBudget === "number") {
        body.generationConfig.thinkingConfig = {
            thinkingBudget: options.thinkingBudget,
        };
    } else if (/(gemini-(2\.5|3)|preview|thinking)/i.test(options.model)) {
        body.generationConfig.thinkingConfig = {
            thinkingBudget: 0,
        };
    }

    if (systemMessage) {
        body.systemInstruction = {
            parts: [{ text: systemMessage }]
        };
    }

    if (options.responseFormat === "json_object") {
        body.generationConfig.responseMimeType = "application/json";
    }

    if (options.responseSchema) {
        body.generationConfig.responseMimeType = "application/json";
        body.generationConfig.responseSchema = options.responseSchema;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${options.apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    const finishReason = data.candidates?.[0]?.finishReason || null;

    return {
        content,
        raw: data,
        finishReason,
        usageMetadata: data.usageMetadata
    };
}
