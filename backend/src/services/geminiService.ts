import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

/**
 * geminiService.ts
 * 
 * RepoInsight의 AI 에이전트 핵심 로직을 담당합니다.
 * Google Gemini API를 사용하여 리포지토리 분석 및 대화를 수행합니다.
 */

const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

const genAI = getGenAI();

// 현재 선택된 모델 (목록 조회 후 동적으로 결정됨)
let currentModelName = "gemini-1.5-flash"; 

interface AIModel {
    name: string;
    displayName: string;
    description: string;
}

/**
 * 가용한 모델 목록 중 최적의 모델을 선택합니다.
 */
const selectBestModel = (models: AIModel[]): string => {
    const priorities = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
    for (const priority of priorities) {
        if (models.some((m: AIModel) => m.name === priority)) return priority;
    }
    return models.length > 0 ? models[0].name : "gemini-1.5-flash";
};

export const getCurrentModel = () => currentModelName;

export const setCurrentModel = (modelName: string) => {
    console.log(`[geminiService] 모델 변경: ${currentModelName} -> ${modelName}`);
    currentModelName = modelName;
};

/**
 * 사용 가능한 모델 목록 조회
 */
export const listAvailableModels = async () => {
    if (!process.env.GEMINI_API_KEY) throw new Error('API Key missing');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        if (!response.ok) throw new Error(`Google API Error`);
        const data = await response.json();
        if (!data.models) return [];
        
        const models: AIModel[] = data.models
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => ({
                name: m.name.replace('models/', ''),
                displayName: m.displayName,
                description: m.description
            }));

        if (models.length > 0) {
            const best = selectBestModel(models);
            if (currentModelName === "gemini-1.5-flash") currentModelName = best;
        }
        return models;
    } catch (error: any) {
        console.error('[geminiService] 모델 조회 오류:', error.message);
        throw error;
    }
};

/**
 * RepoInsight 전문 진단 프로토콜 생성
 */
export const getAiDiagnosis = async (userInput: string): Promise<string> => {
    if (!genAI) return "API 연동 필요";
    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        const result = await model.generateContent(`
            당신은 RepoInsight AI입니다. 다음 문제를 분석하여 마크다운 형식의 전문적인 프로토콜을 생성하세요:
            "${userInput}"
        `);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        throw error;
    }
};

/**
 * RepoInsight 기본 채팅 응답
 */
export const getAiChatResponse = async (message: string): Promise<string> => {
    if (!genAI) return "API 연동 대기 중...";
    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "안녕, 너는 RepoInsight의 AI 어시스턴트야." }] },
                { role: "model", parts: [{ text: "안녕하세요! RepoInsight의 전문 AI 아키텍트입니다. 리포지토리의 기술적 진단과 수명 주기 관리를 위해 무엇을 도와드릴까요?" }] },
            ],
        });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        return `오류 발생: ${error.message}`;
    }
};

/**
 * RepoInsight 스트리밍 응답 (자율 에이전트 핵심)
 */
export const getAiChatStreamResponse = async (message: string, history: Content[] = [], repoContext?: string, modelNameOverride?: string) => {
    const targetModel = modelNameOverride || currentModelName;
    if (!genAI) throw new Error('API Key missing');

    try {
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "list_files",
                        description: "GitHub 저장소의 파일 및 디렉토리 목록을 가져옵니다.",
                        parameters: { type: "object", properties: { path: { type: "string", description: "조회 경로" } } }
                    },
                    {
                        name: "read_file",
                        description: "GitHub 저장소의 특정 파일 내용을 읽어옵니다.",
                        parameters: { type: "object", properties: { path: { type: "string", description: "파일 경로" } }, required: ["path"] }
                    },
                    {
                        name: "read_pr_diff",
                        description: "GitHub PR의 변경 사항을 읽어옵니다.",
                        parameters: { type: "object", properties: { pull_number: { type: "number", description: "PR 번호" } }, required: ["pull_number"] }
                    }
                ]
            }
        ];

        const model = genAI.getGenerativeModel({ 
            model: targetModel,
            tools: tools as any,
            systemInstruction: `당신은 RepoInsight의 전문 AI 아키텍트입니다. 
            당신의 미션은 Git 기반 리포지토리를 대상으로 보안 취약점, 코드 품질, 기술부채, 진척도, 리스크를 종합 진단하는 것입니다.
            현재 분석 대상 저장소: ${repoContext || '선택되지 않음'}.
            반드시 list_files와 read_file 도구를 사용하여 실제 코드를 정밀 분석한 후 데이터를 기반으로 통찰력 있는 답변을 제공하세요.`
        });
        
        let sanitizedHistory = [...history];
        if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') sanitizedHistory.shift();

        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessageStream(message);
        return result;
    } catch (error: any) {
        throw error;
    }
};
