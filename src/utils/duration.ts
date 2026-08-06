/**
 * Parses a duration string like "15m", "7d", "1h", "30s" into milliseconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days).
 */
export function parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
        throw new Error(`Invalid duration format: "${duration}". Expected formats like "15m", "7d", "1h", "30s".`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    const unitToMs: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * unitToMs[unit];
}