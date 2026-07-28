/** Pacific business hours for the Start-Up Specialist welcome popup. */
export const SPECIALIST_TZ = "America/Los_Angeles";

/** Inclusive start: 08:30 PT */
export const SPECIALIST_WINDOW_START_MINUTES = 8 * 60 + 30;

/** Exclusive end: 17:30 PT */
export const SPECIALIST_WINDOW_END_MINUTES = 17 * 60 + 30;

const ELIGIBLE_COUNTRIES = new Set(["US", "CA"]);

/** Cloudflare / edge placeholders that are not real ISO country codes. */
const INVALID_COUNTRY_CODES = new Set(["XX", "T1", "ZZ"]);

/**
 * Resolve the visitor country from edge/proxy headers.
 * Production (cashtapaiaccess.com) sits behind Cloudflare on DigitalOcean,
 * so `cf-ipcountry` is the primary signal — not Vercel's header.
 */
export function resolveRequestCountry(request: Request): string | null {
    const candidates = [
        request.headers.get("cf-ipcountry"), // Cloudflare (production)
        request.headers.get("x-vercel-ip-country"), // Vercel
        request.headers.get("cloudfront-viewer-country"), // AWS CloudFront
        request.headers.get("x-country-code"), // misc proxies / DO
    ];

    for (const raw of candidates) {
        const code = raw?.trim().toUpperCase();
        if (!code || INVALID_COUNTRY_CODES.has(code)) continue;
        if (/^[A-Z]{2}$/.test(code)) return code;
    }

    // Local/dev only: allow ?debugCountry=US to exercise the gate safely.
    if (process.env.NODE_ENV === "development") {
        const url = new URL(request.url);
        const debug = url.searchParams.get("debugCountry");
        if (debug) {
            const code = debug.trim().toUpperCase();
            if (/^[A-Z]{2}$/.test(code) && !INVALID_COUNTRY_CODES.has(code)) {
                return code;
            }
        }
    }

    return null;
}

export function isUsOrCa(country: string | null | undefined): boolean {
    if (!country) return false;
    return ELIGIBLE_COUNTRIES.has(country.trim().toUpperCase());
}

type PtParts = {
    weekday: string;
    hour: number;
    minute: number;
};

function getPacificParts(date: Date): PtParts {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: SPECIALIST_TZ,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? "";

    // Some engines emit "24" for midnight with hour12:false — normalize to 0.
    let hour = Number(get("hour"));
    if (hour === 24) hour = 0;

    return {
        weekday: get("weekday"),
        hour,
        minute: Number(get("minute")),
    };
}

const WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

/**
 * True when `date` falls Mon–Fri, 08:30 inclusive through 17:30 exclusive,
 * in America/Los_Angeles (PST/PDT handled by the timezone).
 */
export function isWithinSpecialistHours(date: Date): boolean {
    const { weekday, hour, minute } = getPacificParts(date);
    if (!WEEKDAYS.has(weekday)) return false;
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

    const minutes = hour * 60 + minute;
    return (
        minutes >= SPECIALIST_WINDOW_START_MINUTES &&
        minutes < SPECIALIST_WINDOW_END_MINUTES
    );
}

/**
 * Milliseconds until the specialist window ends today in PT, or null if
 * currently outside the window.
 */
export function msUntilSpecialistWindowClose(date: Date): number | null {
    if (!isWithinSpecialistHours(date)) return null;

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: SPECIALIST_TZ,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((p) => p.type === type)?.value ?? NaN);

    let hour = get("hour");
    if (hour === 24) hour = 0;
    const minute = get("minute");
    const second = get("second");
    const minutesNow = hour * 60 + minute;
    const msIntoMinute = second * 1000 + date.getMilliseconds();
    return (SPECIALIST_WINDOW_END_MINUTES - minutesNow) * 60_000 - msIntoMinute;
}

export function evaluateSpecialistEligibility(
    country: string | null | undefined,
    date: Date = new Date()
): { eligible: boolean; country: string | null; closesInMs?: number } {
    const normalized = country?.trim().toUpperCase() || null;
    const countryOk = isUsOrCa(normalized);
    const hoursOk = isWithinSpecialistHours(date);
    const eligible = countryOk && hoursOk;

    if (!eligible) {
        return { eligible: false, country: normalized };
    }

    const closesInMs = msUntilSpecialistWindowClose(date);
    return {
        eligible: true,
        country: normalized,
        ...(closesInMs != null ? { closesInMs } : {}),
    };
}
