/**
 * Zero Script QA를 위한 구조화된 로그 유틸리티
 */
export const qaLogger = {
    info: (event: string, data: any) => {
        console.log(JSON.stringify({
            level: 'info',
            timestamp: new Date().toISOString(),
            qa: true,
            event,
            ...data
        }));
    },
    warn: (event: string, data: any) => {
        console.warn(JSON.stringify({
            level: 'warn',
            timestamp: new Date().toISOString(),
            qa: true,
            event,
            ...data
        }));
    },
    error: (event: string, error: any) => {
        console.error(JSON.stringify({
            level: 'error',
            timestamp: new Date().toISOString(),
            qa: true,
            event,
            error: error instanceof Error ? error.message : error
        }));
    }
};
