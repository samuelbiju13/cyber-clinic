import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/services/vision-sync';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Use JPG, PNG, or WebP.' },
                { status: 400 }
            );
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum 10MB.' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await extractTextFromImage(buffer);

        return NextResponse.json({
            text: result.text,
            confidence: result.confidence,
            processingTimeMs: result.processingTimeMs,
        });
    } catch (error) {
        console.error('[OCR Route] Error:', error);
        return NextResponse.json(
            { error: 'OCR processing failed' },
            { status: 500 }
        );
    }
}
