import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// 기본 설정
let currentModelName = "gemini-1.5-flash";

/**
 * AI 응답을 생성하기 위한 제네레이티브 모델 인스턴스를 가져옵니다.
 * [v3.8] 사용자별 API Key를 지원하도록 개선되었습니다.
 */
const getModel = (modelName: string = currentModelName, userApiKey?: string) => {
    // 사용자 키가 있으면 사용, 없으면 환경변수 키 사용
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: modelName,
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

export const listAvailableModels = async () => {
    return [
        { name: "gemini-1.5-flash", description: "Fast and balanced" },
        { name: "gemini-1.5-pro", description: "Complex reasoning" },
        { name: "gemini-2.0-flash-exp", description: "Next generation speed" }
    ];
};

export const setCurrentModel = (name: string) => { currentModelName = name; };
export const getCurrentModel = () => currentModelName;

// 기존 단발성 응답 함수들도 주입받은 키를 사용하도록 유지 (필요 시 확장)
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
