/**
 * Countdown & date formatting helpers for the Medical-Noir UI.
 */

/**
 * Calculate time remaining until a target date.
 * Returns { days, hours, minutes, seconds, expired }.
 */
export function getTimeRemaining(targetDate: string) {
    const total = new Date(targetDate).getTime() - Date.now();
    const expired = total <= 0;

    return {
        total: Math.max(total, 0),
        days: expired ? 0 : Math.floor(total / (1000 * 60 * 60 * 24)),
        hours: expired ? 0 : Math.floor((total / (1000 * 60 * 60)) % 24),
        minutes: expired ? 0 : Math.floor((total / (1000 * 60)) % 60),
        seconds: expired ? 0 : Math.floor((total / 1000) % 60),
        expired,
    };
}

/**
 * Format a date string for display in Medical Archives.
 */
export function formatCheckupDate(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

/**
 * Format relative time (e.g. "3 days ago").
 */
export function relativeTime(date: string): string {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days < 30) return rtf.format(-days, 'day');
    if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
    return rtf.format(-Math.floor(days / 365), 'year');
}
