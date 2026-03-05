/**
 * Vision-Sync OCR — Tesseract.js placeholder for medical report text extraction.
 *
 * Swappable adapter: replace internals with Google Cloud Vision API when ready.
 * Server-side only.
 */
import Tesseract from 'tesseract.js';

export interface OcrResult {
    text: string;
    confidence: number;
    processingTimeMs: number;
}

/**
 * Extract text from an image buffer using Tesseract.js.
 */
export async function extractTextFromImage(
    imageBuffer: Buffer,
    language: string = 'eng'
): Promise<OcrResult> {
    const start = Date.now();

    try {
        const { data } = await Tesseract.recognize(imageBuffer, language, {
            logger: () => { }, // suppress progress logs
        });

        return {
            text: data.text.trim(),
            confidence: data.confidence,
            processingTimeMs: Date.now() - start,
        };
    } catch (error) {
        console.error('[Vision-Sync] OCR extraction failed:', error);
        return {
            text: '',
            confidence: 0,
            processingTimeMs: Date.now() - start,
        };
    }
}

/**
 * Extract text from a file (path or URL).
 */
export async function extractTextFromPath(
    imagePath: string,
    language: string = 'eng'
): Promise<OcrResult> {
    const start = Date.now();

    try {
        const { data } = await Tesseract.recognize(imagePath, language, {
            logger: () => { },
        });

        return {
            text: data.text.trim(),
            confidence: data.confidence,
            processingTimeMs: Date.now() - start,
        };
    } catch (error) {
        console.error('[Vision-Sync] OCR extraction from path failed:', error);
        return {
            text: '',
            confidence: 0,
            processingTimeMs: Date.now() - start,
        };
    }
}
