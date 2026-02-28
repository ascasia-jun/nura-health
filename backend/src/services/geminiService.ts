/**
 * geminiService.ts
 * 
 * 이 서비스는 Google Gemini API와 상호작용하는 모든 로직을 담당합니다.
 * 현재는 실제 API 호출 대신 모의(mock) 데이터를 반환합니다.
 */

/**
 * 사용자의 입력을 기반으로 AI 진단 결과를 요청하고 반환합니다.
 * @param userInput 사용자가 입력한 프로젝트 문제점
 * @returns AI가 생성한 진단 및 해결책
 */
export const getAiDiagnosis = async (userInput: string): Promise<string> => {
    console.log(`[geminiService] Received input for diagnosis: "${userInput}"`);

    // --- 실제 Gemini API 호출 로직 (향후 구현) ---
    // const { GoogleGenerativeAI } = require("@google/generative-ai");
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    // const prompt = `...`;
    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = response.text();
    // return text;
    // -----------------------------------------

    // 현재는 2초 지연 후 모의 응답을 반환합니다.
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResponse = `
### AI 진단 결과: React 프로젝트 초기 로딩 속도 저하

**1. 원인 분석:**
   - **거대한 Vendor 번들:** 'node_modules'의 많은 라이브러리가 단일 'vendors.js' 파일로 번들링되어 초기 다운로드 크기가 증가했습니다.
   - **이미지 최적화 부재:** 고해상도 이미지가 원본 그대로 사용되어 리소스 로딩 시간을 지연시키고 있습니다.
   - **불필요한 리렌더링:** 일부 컴포넌트에서 memoization이 적용되지 않아 상태 변경 시 과도한 리렌더링이 발생합니다.

**2. 해결 프로토콜:**
   - **Code Splitting (코드 분할):** 'React.lazy()'와 'Suspense'를 사용하여 라우트 기반으로 코드를 분할하세요. 사용자가 특정 페이지에 접근할 때만 해당 페이지의 코드를 로드합니다.
   - **이미지 최적화:** 이미지를 WebP와 같은 차세대 포맷으로 변환하고, '<picture>' 태그를 사용하여 다양한 해상도의 이미지를 제공하세요.
   - **Memoization 적용:** 'React.memo' HOC를 사용하여 불필요한 리렌더링이 발생하는 컴포넌트를 감싸세요. 특히, props가 자주 변경되지 않는 순수 컴포넌트에 효과적입니다.
`;

    console.log('[geminiService] Returning mock diagnosis.');
    return mockResponse;
};

/**
 * 사용자의 채팅 메시지에 대한 AI 응답을 반환합니다.
 * @param message 사용자 메시지
 * @returns AI 응답 메시지
 */
export const getAiChatResponse = async (message: string): Promise<string> => {
    console.log(`[geminiService] Received chat message: "${message}"`);

    // 모의 지연
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 간단한 키워드 기반 모의 응답 로직 (데모용)
    if (message.includes('안녕')) {
        return "안녕하세요! Nura Health AI 어시스턴트입니다. 무엇을 도와드릴까요?";
    } else if (message.includes('느려') || message.includes('속도')) {
        return "프로젝트 속도 문제로 고민이시군요. 'AI 진단' 기능을 통해 구체적인 원인을 분석해보시는 건 어떨까요? 대시보드의 'AI 진단 시작' 버튼을 눌러보세요.";
    } else if (message.includes('오류') || message.includes('에러')) {
        return "발생한 에러 로그를 공유해주시면 더 정확한 분석이 가능합니다. 또는 '데이터 스트리머' 패널에서 실시간 로그 분석을 확인하실 수 있습니다.";
    }

    return "죄송합니다. 아직 학습 중이라 정확히 이해하지 못했습니다. 프로젝트 최적화나 진단에 대해 질문해주시면 답변해 드리겠습니다.";
};
