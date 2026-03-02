import fs from 'fs/promises';
import path from 'path';

/**
 * 스킬 메타데이터 인터페이스
 */
export interface SkillMetadata {
    id: string;
    name: string;
    description: string;
    triggers?: string[];
}

/**
 * 사용자 메시지에서 가장 적합한 스킬 ID를 자동으로 감지합니다.
 */
export async function detectSkillFromMessage(message: string): Promise<string | null> {
    try {
        const skillsDir = path.join(__dirname, '../skills');
        const entries = await fs.readdir(skillsDir, { withFileTypes: true });
        
        const candidates: { id: string; score: number }[] = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const metadataPath = path.join(skillsDir, entry.name, 'metadata.json');
                    const metadataRaw = await fs.readFile(metadataPath, 'utf-8');
                    const metadata: SkillMetadata = JSON.parse(metadataRaw);

                    if (metadata.triggers && Array.isArray(metadata.triggers)) {
                        let score = 0;
                        for (const trigger of metadata.triggers) {
                            // 대소문자 구분 없이 키워드 포함 여부 확인
                            if (message.toLowerCase().includes(trigger.toLowerCase())) {
                                score++;
                            }
                        }
                        
                        if (score > 0) {
                            candidates.push({ id: entry.name, score });
                        }
                    }
                } catch (e) {
                    // metadata.json이 없거나 triggers가 없으면 건너뜀
                }
            }
        }

        if (candidates.length === 0) return null;

        // 가장 점수가 높은 스킬 반환 (점수가 같으면 첫 번째 항목)
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].id;

    } catch (error) {
        console.error('[SkillDetector] 감지 실패:', error);
        return null;
    }
}
