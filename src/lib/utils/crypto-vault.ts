/**
 * Crypto-Vault — AES-256-GCM field-level encryption for sensitive patient data.
 *
 * Server-side only. Never import this in client components.
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
    const hex = process.env.ENCRYPTION_MASTER_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error(
            'ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes).'
        );
    }
    return Buffer.from(hex, 'hex');
}

export interface EncryptedPayload {
    ciphertext: string; // base64
    iv: string; // base64
    tag: string; // base64
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 */
export function encrypt(plaintext: string): EncryptedPayload {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();

    return {
        ciphertext: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
    };
}

/**
 * Decrypt a ciphertext with AES-256-GCM.
 */
export function decrypt(payload: EncryptedPayload): string {
    const key = getMasterKey();
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Convenience: encrypt and return the combined string for DB storage.
 * Format: iv:tag:ciphertext (all base64)
 */
export function encryptForStorage(plaintext: string): string {
    const { ciphertext, iv, tag } = encrypt(plaintext);
    return `${iv}:${tag}:${ciphertext}`;
}

/**
 * Convenience: decrypt a combined storage string.
 */
export function decryptFromStorage(stored: string): string {
    const [iv, tag, ciphertext] = stored.split(':');
    return decrypt({ ciphertext, iv, tag });
}
