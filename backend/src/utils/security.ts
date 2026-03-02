import crypto from 'crypto';

/**
 * 보안 유틸리티 (v3.7 - AES-256-GCM Encryption)
 */

// 암호화 키 (환경 변수에서 로드, 없으면 기본값 사용 - 실제 운영 시 필수 설정 필요)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'repoinsight-super-secret-key-32b'; 
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 데이터를 암호화합니다.
 * 반환 형식: "iv:authTag:encryptedData" (Base64)
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.alloc(32, ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * 암호화된 데이터를 복호화합니다.
 */
export function decrypt(encryptedText: string): string {
    try {
        const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.alloc(32, ENCRYPTION_KEY), iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('[Security] Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}
