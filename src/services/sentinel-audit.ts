/**
 * Sentinel Audit Log — Immutable event recorder.
 *
 * Server-side only. Records every database access event to the audit_logs table.
 */
import { createClient } from '@/lib/supabase/server';
import type { AuditAction } from '@/types';

interface AuditEvent {
    user_id: string;
    action: AuditAction;
    target_table: string;
    target_row_id?: string;
    ip_address: string;
    user_agent?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log an audit event to the immutable audit_logs table.
 */
export async function logAuditEvent(event: AuditEvent) {
    try {
        const supabase = await createClient();

        const { error } = await supabase.from('audit_logs').insert({
            user_id: event.user_id,
            action: event.action,
            target_table: event.target_table,
            target_row_id: event.target_row_id || null,
            ip_address: event.ip_address,
            user_agent: event.user_agent || null,
            metadata: event.metadata || null,
        });

        if (error) {
            console.error('[Sentinel] Failed to write audit log:', error.message);
        }
    } catch (err) {
        // Audit logging should never crash the main operation
        console.error('[Sentinel] Unexpected error:', err);
    }
}

/**
 * Extract IP address from request headers.
 */
export function extractIP(headers: Headers): string {
    return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        '0.0.0.0'
    );
}
