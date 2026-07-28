/**
 * Verifies the REAL production eligibility module (src/lib/specialist-popup-eligibility.ts)
 * against an exhaustive matrix: weekday/weekend, window boundaries to the second,
 * PST vs PDT (incl. DST transition weeks), and country normalization.
 *
 * Run: node --experimental-strip-types scripts/verify-specialist-eligibility.mjs
 */

import {
    isUsOrCa,
    isWithinSpecialistHours,
    msUntilSpecialistWindowClose,
    evaluateSpecialistEligibility,
    resolveRequestCountry,
    countryFromIp,
    SPECIALIST_TZ,
} from "../src/lib/specialist-popup-eligibility.ts";

/** Build a Date whose wall time in America/Los_Angeles equals the given parts. */
function ptDate({ year, month, day, hour, minute, second = 0 }) {
    const pad = (n) => String(n).padStart(2, "0");
    const target = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: SPECIALIST_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const label = (ms) => {
        const parts = fmt.formatToParts(new Date(ms));
        const get = (t) => parts.find((p) => p.type === t)?.value;
        let h = Number(get("hour"));
        if (h === 24) h = 0;
        return `${get("year")}-${get("month")}-${get("day")} ${pad(h)}:${get("minute")}:${get("second")}`;
    };

    let lo = Date.UTC(year, month - 1, day - 1, 0, 0, 0);
    let hi = Date.UTC(year, month - 1, day + 1, 23, 59, 59);
    for (let i = 0; i < 48; i++) {
        const mid = Math.floor((lo + hi) / 2);
        const l = label(mid);
        if (l === target) return new Date(mid);
        if (l < target) lo = mid + 1;
        else hi = mid - 1;
    }
    throw new Error(`Could not resolve PT date for ${target}`);
}

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
    const ok = actual === expected;
    if (ok) {
        passed += 1;
        console.log(`PASS  ${name}`);
    } else {
        failed += 1;
        console.error(`FAIL  ${name} — expected ${expected}, got ${actual}`);
    }
}

/* ---------------- Country normalization ---------------- */
check("country US", isUsOrCa("US"), true);
check("country CA", isUsOrCa("CA"), true);
check("country us (lowercase)", isUsOrCa("us"), true);
check("country Ca (mixed case)", isUsOrCa("Ca"), true);
check("country ' us ' (whitespace)", isUsOrCa(" us "), true);
check("country GB", isUsOrCa("GB"), false);
check("country MX", isUsOrCa("MX"), false);
check("country DE", isUsOrCa("DE"), false);
check("country USA (3-letter, invalid)", isUsOrCa("USA"), false);
check("country empty string", isUsOrCa(""), false);
check("country null", isUsOrCa(null), false);
check("country undefined", isUsOrCa(undefined), false);

/* ---------------- Window boundaries (PDT — July 2026) ---------------- */
// Mon Jul 27 2026 is a Monday.
check(
    "Mon 08:29:59 PT → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 27, hour: 8, minute: 29, second: 59 })),
    false
);
check(
    "Mon 08:30:00 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 27, hour: 8, minute: 30, second: 0 })),
    true
);
check(
    "Mon 12:00 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 27, hour: 12, minute: 0 })),
    true
);
check(
    "Fri 17:29:59 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 31, hour: 17, minute: 29, second: 59 })),
    true
);
check(
    "Fri 17:30:00 PT → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 31, hour: 17, minute: 30, second: 0 })),
    false
);
check(
    "Mon 00:00 PT (midnight) → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 27, hour: 0, minute: 0 })),
    false
);
check(
    "Mon 23:59 PT → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 7, day: 27, hour: 23, minute: 59 })),
    false
);

/* ---------------- Every day of the week at noon PT ---------------- */
// Jul 26 2026 = Sunday … Aug 1 2026 = Saturday
const week = [
    { day: 26, name: "Sunday", open: false },
    { day: 27, name: "Monday", open: true },
    { day: 28, name: "Tuesday", open: true },
    { day: 29, name: "Wednesday", open: true },
    { day: 30, name: "Thursday", open: true },
    { day: 31, name: "Friday", open: true },
    { day: 1, month: 8, name: "Saturday", open: false },
];
for (const d of week) {
    check(
        `${d.name} 12:00 PT → ${d.open ? "open" : "closed"}`,
        isWithinSpecialistHours(
            ptDate({ year: 2026, month: d.month ?? 7, day: d.day, hour: 12, minute: 0 })
        ),
        d.open
    );
}

/* ---------------- PST (winter) and DST transition weeks ---------------- */
// Mon Jan 12 2026 — deep winter, PST (UTC-8)
check(
    "Winter PST: Mon Jan 12 2026 08:30 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 1, day: 12, hour: 8, minute: 30 })),
    true
);
check(
    "Winter PST: Mon Jan 12 2026 17:30 PT → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 1, day: 12, hour: 17, minute: 30 })),
    false
);
// DST starts Sun Mar 8 2026 → Mon Mar 9 is first PDT weekday
check(
    "DST-start week: Mon Mar 9 2026 08:30 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 3, day: 9, hour: 8, minute: 30 })),
    true
);
check(
    "DST-start week: Fri Mar 6 2026 17:29 PT (still PST) → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 3, day: 6, hour: 17, minute: 29 })),
    true
);
// DST ends Sun Nov 1 2026 → Mon Nov 2 is first PST weekday
check(
    "DST-end week: Mon Nov 2 2026 08:30 PT → open",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 11, day: 2, hour: 8, minute: 30 })),
    true
);
check(
    "DST-end week: Mon Nov 2 2026 17:30 PT → closed",
    isWithinSpecialistHours(ptDate({ year: 2026, month: 11, day: 2, hour: 17, minute: 30 })),
    false
);

/* ---------------- msUntilSpecialistWindowClose ---------------- */
{
    const at1700 = ptDate({ year: 2026, month: 7, day: 27, hour: 17, minute: 0, second: 0 });
    const ms = msUntilSpecialistWindowClose(at1700);
    const ok = ms !== null && ms > 29 * 60_000 && ms <= 30 * 60_000;
    check(`closesInMs at 17:00 PT ≈ 30min (got ${ms}ms)`, ok, true);
}
{
    const closed = ptDate({ year: 2026, month: 7, day: 26, hour: 12, minute: 0 });
    check(
        "closesInMs outside window → null",
        msUntilSpecialistWindowClose(closed),
        null
    );
}

/* ---------------- Composite evaluation ---------------- */
const openTime = ptDate({ year: 2026, month: 7, day: 28, hour: 10, minute: 0 });
const closedTime = ptDate({ year: 2026, month: 7, day: 26, hour: 10, minute: 0 });

check("US + open window → eligible", evaluateSpecialistEligibility("US", openTime).eligible, true);
check("CA + open window → eligible", evaluateSpecialistEligibility("CA", openTime).eligible, true);
check("' ca ' + open window → eligible", evaluateSpecialistEligibility(" ca ", openTime).eligible, true);
check("GB + open window → NOT eligible", evaluateSpecialistEligibility("GB", openTime).eligible, false);
check("null country + open window → NOT eligible", evaluateSpecialistEligibility(null, openTime).eligible, false);
check("US + Sunday → NOT eligible", evaluateSpecialistEligibility("US", closedTime).eligible, false);
check("CA + Sunday → NOT eligible", evaluateSpecialistEligibility("CA", closedTime).eligible, false);
check(
    "eligible response includes closesInMs",
    typeof evaluateSpecialistEligibility("US", openTime).closesInMs,
    "number"
);
check(
    "ineligible response has no closesInMs",
    "closesInMs" in evaluateSpecialistEligibility("US", closedTime),
    false
);

/* ---------------- Country resolution (headers + DigitalOcean GeoIP) ---------------- */
function reqWithHeaders(headers) {
    return new Request("https://example.com/api/eligibility/specialist-popup", {
        headers,
    });
}
check(
    "resolveCountry uses explicit country header",
    resolveRequestCountry(reqWithHeaders({ "x-vercel-ip-country": "us" })),
    "US"
);
check(
    "resolveCountry ignores placeholder XX",
    resolveRequestCountry(reqWithHeaders({ "cf-ipcountry": "XX" })),
    null
);
check(
    "resolveCountry GeoIP via do-connecting-ip (US)",
    resolveRequestCountry(reqWithHeaders({ "do-connecting-ip": "8.8.8.8" })),
    "US"
);
check(
    "resolveCountry GeoIP via do-connecting-ip (CA)",
    resolveRequestCountry(reqWithHeaders({ "do-connecting-ip": "24.48.0.1" })),
    "CA"
);
check(
    "resolveCountry null when no IP/headers",
    resolveRequestCountry(reqWithHeaders({})),
    null
);
check("countryFromIp US", countryFromIp("8.8.8.8"), "US");
check("countryFromIp CA", countryFromIp("24.48.0.1"), "CA");
check("countryFromIp null input", countryFromIp(null), null);

/* ---------------- Result ---------------- */
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
