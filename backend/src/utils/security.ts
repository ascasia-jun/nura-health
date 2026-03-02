import crypto from 'crypto';

/**
 * 보안 유틸리티 (v3.8 - AES-256-GCM Encryption)
 * [Hotfix] 환경 변수 누락 및 키 길이 불일치 방어 코드 추가
 */

// 암호화 키 (32바이트 고정 확보)
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY || 'repoinsight-default-secure-key-32';
    // 32바이트를 초과하거나 부족할 경우를 대비해 해싱하여 고정 길이 확보
    return crypto.createHash('sha256').update(key).digest();
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * 데이터를 암호화합니다.
 */
export function encrypt(text: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getEncryptionKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('[Security] Encryption failed:', error);
        throw new Error('Encryption processing failed');
    }
}

/**
 * 암호화된 데이터를 복호화합니다.
 */
export function decrypt(encryptedText: string): string {
    try {
        const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('[Security] Decryption failed:', error);
        throw new Error('Decryption processing failed');
    }
}
