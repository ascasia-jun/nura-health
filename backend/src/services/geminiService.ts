import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let currentModelName = "gemini-2.0-flash";

/**
 * [v3.8 Refinement] API Key 유효성 검증 - 상세 에러 처리 추가
 */
export const validateGeminiKey = async (apiKey: string): Promise<{isValid: boolean, error?: string}> => {
    try {
        console.log(`[Gemini] Requesting model list to verify key...`);
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            timeout: 10000 // 10초로 연장
        });
        return { isValid: res.status === 200 };
    } catch (e: any) {
        const errorMsg = e.response?.data?.error?.message || e.message;
        console.error('[Gemini] Validation failed:', errorMsg);
        
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
            return { isValid: false, error: '구글 API 서버에 접속할 수 없습니다. 네트워크 설정을 확인하세요.' };
        }
        return { isValid: false, error: `인증 실패: ${errorMsg}` };
    }
};

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

export const listAvailableModels = async (userApiKey?: string) => {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return [{ name: "gemini-2.0-flash", description: "Default (Key missing)" }];
    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { timeout: 10000 });
        const allModels = res.data.models || [];
        const filtered = allModels
            .filter((m: any) => m.name.startsWith('models/gemini') && m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => ({ name: m.name.replace('models/', ''), description: m.description || m.displayName }))
            .filter((m: any) => !["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"].includes(m.name));
        return filtered.length > 0 ? filtered : [{ name: "gemini-2.0-flash", description: "Gemini 2.0 Flash" }];
    } catch (e) {
        return [{ name: "gemini-2.0-flash", description: "Gemini 2.0 Flash" }, { name: "gemini-2.0-pro-exp", description: "Gemini 2.0 Pro" }];
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
