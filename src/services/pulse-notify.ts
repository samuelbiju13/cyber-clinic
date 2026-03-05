/**
 * Pulse Notification Engine — Browser Notification API scheduler
 * for medication reminders.
 *
 * Client-side only.
 */
import type { PrescriptionItem } from '@/types';

/**
 * Request notification permission from the user.
 */
export async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('[Pulse] Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
}

/**
 * Fire a browser notification immediately.
 */
export function fireNotification(title: string, body: string, icon?: string) {
    if (Notification.permission !== 'granted') return;

    new Notification(title, {
        body,
        icon: icon || '/icons/pill.svg',
        badge: '/icons/pill.svg',
        tag: `pulse-${Date.now()}`,
    });
}

/**
 * Parse a frequency string (e.g., "twice daily", "3 times daily")
 * into intervals in milliseconds.
 */
function parseFrequencyMs(frequency: string): number {
    const lower = frequency.toLowerCase();
    const dayMs = 24 * 60 * 60 * 1000;

    if (lower.includes('once') || lower === 'daily') return dayMs;
    if (lower.includes('twice')) return dayMs / 2;
    if (lower.includes('thrice') || lower.includes('3 times')) return dayMs / 3;
    if (lower.includes('4 times')) return dayMs / 4;
    if (lower.includes('every 6') || lower.includes('6 hour')) return 6 * 60 * 60 * 1000;
    if (lower.includes('every 8') || lower.includes('8 hour')) return 8 * 60 * 60 * 1000;
    if (lower.includes('every 12') || lower.includes('12 hour')) return 12 * 60 * 60 * 1000;

    // Default to once daily
    return dayMs;
}

export interface MedicationTimer {
    drugName: string;
    intervalId: ReturnType<typeof setInterval>;
}

const activeTimers: MedicationTimer[] = [];

/**
 * Schedule medication reminders for a list of prescription items.
 */
export function scheduleMedicationReminders(items: PrescriptionItem[]): void {
    // Clear existing timers
    clearAllTimers();

    items.forEach((item) => {
        const intervalMs = parseFrequencyMs(item.frequency);

        const intervalId = setInterval(() => {
            fireNotification(
                `💊 Time for ${item.drug_name}`,
                `Take ${item.dosage} — ${item.instructions || item.frequency}`,
            );
        }, intervalMs);

        activeTimers.push({ drugName: item.drug_name, intervalId });
    });
}

/**
 * Clear all active medication timers.
 */
export function clearAllTimers(): void {
    activeTimers.forEach(({ intervalId }) => clearInterval(intervalId));
    activeTimers.length = 0;
}

/**
 * Get count of active timers.
 */
export function getActiveTimerCount(): number {
    return activeTimers.length;
}
