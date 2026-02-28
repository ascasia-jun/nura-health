import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

/**
 * geminiService.ts
 * 
 * 이 서비스는 Google Gemini API와 상호작용하는 모든 로직을 담당하며,
 * 동적 모델 선택 및 목록 관리 기능을 포함합니다.
 */

const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

const genAI = getGenAI();

// 현재 선택된 모델 (기본값 설정)
let currentModelName = "gemini-1.5-flash";

/**
 * 현재 사용 중인 모델명을 반환합니다.
 */
export const getCurrentModel = () => currentModelName;

/**
 * 사용할 모델을 동적으로 변경합니다.
 * @param modelName 변경할 모델명 (예: 'gemini-2.0-flash')
 */
export const setCurrentModel = (modelName: string) => {
    console.log(`[geminiService] 모델 변경됨: ${currentModelName} -> ${modelName}`);
    currentModelName = modelName;
};

/**
 * 현재 API 키로 사용 가능한 모델 목록을 조회합니다.
 */
export const listAvailableModels = async () => {
    if (!genAI) throw new Error('API Key missing');
    
    try {
        // HTTP 요청을 통해 가용 모델 목록을 직접 조회 (SDK 제약 회피)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (!data.models) return [];
        
        // 생성(generateContent)을 지원하는 모델만 필터링
        return data.models
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => ({
                name: m.name.replace('models/', ''),
                displayName: m.displayName,
                description: m.description
            }));
    } catch (error: any) {
        console.error('[geminiService] 모델 목록 조회 오류:', error.message);
        return [];
    }
};

/**
 * 사용자의 입력을 기반으로 AI 진단 결과를 요청하고 반환합니다.
 */
export const getAiDiagnosis = async (userInput: string): Promise<string> => {
    console.log(`[geminiService] 진단 요청 (모델: ${currentModelName}): "${userInput}"`);

    if (!genAI) return "API 키가 설정되지 않았습니다.";

    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        const result = await model.generateContent(`
            당신은 Nura AI입니다. 다음 문제를 분석하여 마크다운 형식의 전문적인 프로토콜을 생성하세요:
            "${userInput}"
        `);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('[geminiService] 진단 오류:', error.message);
        throw error;
    }
};

/**
 * 사용자의 채팅 메시지에 대한 AI 응답을 반환합니다.
 */
export const getAiChatResponse = async (message: string): Promise<string> => {
    console.log(`[geminiService] 채팅 수신 (모델: ${currentModelName}): "${message}"`);

    if (!genAI) return "API 연동 대기 중...";

    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "안녕, 너는 Nura Health의 AI 어시스턴트야." }] },
                { role: "model", parts: [{ text: "안녕하세요! Nura Health의 AI 어시스턴트 Nura입니다. 무엇을 도와드릴까요?" }] },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('[geminiService] 채팅 오류 상세:', error.message);
        return `오류 발생 (${currentModelName}): ${error.message}. 다른 모델을 선택해 보세요.`;
    }
};

/**
 * 사용자의 채팅 메시지에 대해 스트리밍 형식으로 AI 응답을 반환합니다.
 */
export const getAiChatStreamResponse = async (message: string, history: Content[] = []) => {
    console.log(`[geminiService] 스트리밍 수신 (모델: ${currentModelName}): "${message}"`);

    if (!genAI) throw new Error('API Key missing');

    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        
        // Gemini 규칙: 히스토리는 반드시 'user'로 시작해야 함
        let sanitizedHistory = [...history];
        if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') {
            console.log('[geminiService] 첫 번째 메시지가 model이므로 제거하여 규칙 준수');
            sanitizedHistory.shift();
        }

        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessageStream(message);
        return result.stream;
    } catch (error: any) {
        console.error('[geminiService] 스트리밍 오류:', error.message);
        throw error;
    }
};
