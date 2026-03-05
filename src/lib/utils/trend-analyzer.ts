/**
 * Trend-Analyzer — Health Delta calculator.
 *
 * Computes percentage change in vitals between two checkups.
 */
import type { Vitals, HealthDelta } from '@/types';

/**
 * Parse blood pressure string "120/80" → { systolic: 120, diastolic: 80 }
 */
function parseBP(bp: string): { systolic: number; diastolic: number } | null {
    const match = bp.match(/^(\d+)\/(\d+)$/);
    if (!match) return null;
    return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
}

/**
 * Calculate percentage change: ((current - previous) / previous) * 100
 * Returns null if either value is missing.
 */
function percentChange(current: number | null | undefined, previous: number | null | undefined): number | null {
    if (current == null || previous == null || previous === 0) return null;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Calculate health delta between the current and previous vitals.
 */
export function calculateHealthDelta(
    current: Vitals,
    previous: Vitals
): HealthDelta {
    // New Schema uses direct numbers
    return {
        bpSystolicDelta: percentChange(current.bp_systolic, previous.bp_systolic),
        bpDiastolicDelta: percentChange(current.bp_diastolic, previous.bp_diastolic),
        pulseDelta: percentChange(current.pulse_bpm, previous.pulse_bpm),
        spo2Delta: percentChange(current.spo2, previous.spo2),
        weightDelta: percentChange(current.weight_kg, previous.weight_kg),
    };
}

/**
 * Determine the trend direction for a delta value.
 */
export function getTrendDirection(delta: number | null): 'up' | 'down' | 'stable' | 'unknown' {
    if (delta === null) return 'unknown';
    if (Math.abs(delta) < 1) return 'stable';
    return delta > 0 ? 'up' : 'down';
}
