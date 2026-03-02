import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// [v3.8] 공식 서비스용 최신 표준 모델로 기본값 변경
let currentModelName = "gemini-2.0-flash";

/**
 * [v3.8] API Key 유효성 검증
 */
export const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
    try {
        // 가장 가벼운 모델 목록 조회 엔드포인트로 유효성 확인
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            timeout: 5000 // 5초 타임아웃
        });
        return res.status === 200;
    } catch (e: any) {
        console.error('[Gemini] Key validation failed:', e.response?.data || e.message);
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
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        },
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
 * [v3.8] 공식 지원 모델 라인업 정문화
 */
export const listAvailableModels = async () => {
    return [
        { name: "gemini-2.0-flash", description: "Next-gen high speed & high accuracy (Recommended)" },
        { name: "gemini-2.0-pro-exp", description: "Highest intelligence for complex reasoning" }
    ];
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
