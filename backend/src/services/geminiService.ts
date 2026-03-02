import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let currentModelName = "gemini-2.0-flash";

/**
 * [v3.8] API Key 유효성 검증
 */
export const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            timeout: 5000
        });
        return res.status === 200;
    } catch (e: any) {
        return false;
    }
};

/**
 * AI 응답을 생성하기 위한 제네레이티브 모델 인스턴스를 가져옵니다.
 */
const getModel = (modelName: string = currentModelName, userApiKey?: string) => {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const deprecatedModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    const targetModel = deprecatedModels.includes(modelName) ? "gemini-2.0-flash" : modelName;

    return genAI.getGenerativeModel({
        model: targetModel,
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });
};

/**
 * AI 스트리밍 응답을 생성합니다.
 */
export const getAiChatStreamResponse = async (prompt: string, history: any[], context?: string, modelName?: string, userApiKey?: string) => {
    const model = getModel(modelName || currentModelName, userApiKey);
    const chat = model.startChat({
        history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: h.parts.map((p: any) => ({ text: p.text || p.content || "" }))
        })),
    });
    const fullPrompt = context ? `Context: ${context}\n\nUser Message: ${prompt}` : prompt;
    return await chat.sendMessageStream(fullPrompt);
};

/**
 * [v3.8 Refinement] 사용자의 키를 사용하여 가용한 모델 목록을 실시간으로 조회합니다.
 */
export const listAvailableModels = async (userApiKey?: string) => {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return [{ name: "gemini-2.0-flash", description: "Default (Key missing)" }];

    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const allModels = res.data.models || [];
        
        // 유효한 텍스트 생성 모델만 필터링 (gemini 시리즈)
        const filtered = allModels
            .filter((m: any) => m.name.startsWith('models/gemini') && m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => ({
                name: m.name.replace('models/', ''),
                description: m.description || m.displayName
            }))
            .filter((m: any) => !["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"].includes(m.name)); // 구형 모델 제외

        return filtered.length > 0 ? filtered : [{ name: "gemini-2.0-flash", description: "Gemini 2.0 Flash" }];
    } catch (e) {
        // 오류 발생 시 기본 라인업 반환
        return [
            { name: "gemini-2.0-flash", description: "Next-gen high speed (System Default)" },
            { name: "gemini-2.0-pro-exp", description: "Highest intelligence (Experimental)" }
        ];
    }
};

export const setCurrentModel = (name: string) => { currentModelName = name; };
export const getCurrentModel = () => currentModelName;

export const getAiDiagnosis = async (issue: string, userApiKey?: string) => {
    const model = getModel(currentModelName, userApiKey);
    const result = await model.generateContent(`Analyze this project issue and provide a resolution protocol: ${issue}`);
    return result.response.text();
};

export const getAiChatResponse = async (message: string, history: any[], userApiKey?: string) => {
    const model = getModel(currentModelName, userApiKey);
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    return result.response.text();
};
