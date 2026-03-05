// ─── Medical-Noir Theme Constants ────────────────────────────────────

export const COLORS = {
    bgVoid: '#0B0E11',
    bgGlass: 'rgba(11,14,17,0.6)',
    pulseCyan: '#00F5FF',
    bioEmerald: '#22C55E',
    dangerRed: '#EF4444',
    textPrimary: '#E2E8F0',
    textMuted: '#64748B',
    bgGlassBorder: 'rgba(0,245,255,0.15)',
} as const;

export const ROLES = {
    DOCTOR: 'doctor',
    PATIENT: 'patient',
} as const;

export const CHECKUP_STATUS = {
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const;

export const PRESCRIPTION_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REFILLED: 'refilled',
} as const;

export const AI_AUDIT_STATUS = {
    PENDING: 'pending',
    CLEAR: 'clear',
    FLAGGED: 'flagged',
} as const;
