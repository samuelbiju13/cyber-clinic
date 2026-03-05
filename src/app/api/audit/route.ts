import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, extractIP } from '@/services/sentinel-audit';
import { z } from 'zod';

const auditSchema = z.object({
    user_id: z.string().uuid(),
    action: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
    target_table: z.string().min(1),
    target_row_id: z.string().uuid().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = auditSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid audit event', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        await logAuditEvent({
            ...parsed.data,
            ip_address: extractIP(request.headers),
            user_agent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({ logged: true });
    } catch (error) {
        console.error('[Audit Route] Error:', error);
        return NextResponse.json(
            { error: 'Failed to log audit event' },
            { status: 500 }
        );
    }
}
