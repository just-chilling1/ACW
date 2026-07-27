/**
 * Verifies specialist popup eligibility edge cases without a test runner.
 * Run: node scripts/verify-specialist-eligibility.mjs
 *
 * Mirrors src/lib/specialist-popup-eligibility.ts logic.
 */

const SPECIALIST_TZ = "America/Los_Angeles";
const START = 8 * 60 + 30;
const END = 17 * 60 + 30;
const ELIGIBLE = new Set(["US", "CA"]);

function isUsOrCa(country) {
  if (!country) return false;
  return ELIGIBLE.has(country.trim().toUpperCase());
}

function getPacificParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SPECIALIST_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  return { weekday: get("weekday"), hour, minute: Number(get("minute")) };
}

function isWithinSpecialistHours(date) {
  const { weekday, hour, minute } = getPacificParts(date);
  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)) return false;
  const minutes = hour * 60 + minute;
  return minutes >= START && minutes < END;
}

function evaluate(country, date) {
  const normalized = country?.trim().toUpperCase() || null;
  return {
    eligible: isUsOrCa(normalized) && isWithinSpecialistHours(date),
    country: normalized,
  };
}

/** Build a Date that formats as the given wall time in America/Los_Angeles. */
function ptDate({ year, month, day, hour, minute }) {
  // Binary search UTC instant for desired PT wall clock
  const targetLabel = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  let lo = Date.UTC(year, month - 1, day - 1, 0, 0, 0);
  let hi = Date.UTC(year, month - 1, day + 1, 23, 59, 59);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SPECIALIST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  for (let i = 0; i < 40; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const parts = fmt.formatToParts(new Date(mid));
    const get = (t) => parts.find((p) => p.type === t)?.value;
    let h = Number(get("hour"));
    if (h === 24) h = 0;
    const label = `${get("year")}-${get("month")}-${get("day")} ${String(h).padStart(2, "0")}:${get("minute")}`;
    if (label === targetLabel) return new Date(mid);
    if (label < targetLabel) lo = mid + 1;
    else hi = mid - 1;
  }
  throw new Error(`Could not resolve PT date for ${targetLabel}`);
}

const cases = [
  {
    name: "US + Tue 10:00 PT → eligible",
    country: "US",
    date: ptDate({ year: 2026, month: 7, day: 28, hour: 10, minute: 0 }), // Tue
    expected: true,
  },
  {
    name: "CA + Wed 08:30 PT → eligible",
    country: "CA",
    date: ptDate({ year: 2026, month: 7, day: 29, hour: 8, minute: 30 }), // Wed
    expected: true,
  },
  {
    name: "US + Fri 17:29 PT → eligible",
    country: "US",
    date: ptDate({ year: 2026, month: 7, day: 31, hour: 17, minute: 29 }), // Fri
    expected: true,
  },
  {
    name: "US + Fri 17:30 PT → not eligible",
    country: "US",
    date: ptDate({ year: 2026, month: 7, day: 31, hour: 17, minute: 30 }),
    expected: false,
  },
  {
    name: "US + Sat 12:00 PT → not eligible",
    country: "US",
    date: ptDate({ year: 2026, month: 8, day: 1, hour: 12, minute: 0 }), // Sat
    expected: false,
  },
  {
    name: "GB + weekday midday PT → not eligible",
    country: "GB",
    date: ptDate({ year: 2026, month: 7, day: 28, hour: 12, minute: 0 }),
    expected: false,
  },
  {
    name: "MX + weekday midday PT → not eligible",
    country: "MX",
    date: ptDate({ year: 2026, month: 7, day: 28, hour: 12, minute: 0 }),
    expected: false,
  },
  {
    name: "missing country + weekday midday PT → not eligible",
    country: null,
    date: ptDate({ year: 2026, month: 7, day: 28, hour: 12, minute: 0 }),
    expected: false,
  },
  {
    name: "us lowercase + Mon 08:30 → eligible",
    country: "us",
    date: ptDate({ year: 2026, month: 7, day: 27, hour: 8, minute: 30 }), // Mon
    expected: true,
  },
  {
    name: "US + Mon 08:29 → not eligible",
    country: "US",
    date: ptDate({ year: 2026, month: 7, day: 27, hour: 8, minute: 29 }),
    expected: false,
  },
];

let failed = 0;
for (const c of cases) {
  const result = evaluate(c.country, c.date);
  const parts = getPacificParts(c.date);
  const ok = result.eligible === c.expected;
  if (!ok) {
    failed += 1;
    console.error(
      `FAIL: ${c.name}\n  got eligible=${result.eligible} (PT ${parts.weekday} ${parts.hour}:${String(parts.minute).padStart(2, "0")})`
    );
  } else {
    console.log(
      `PASS: ${c.name} (PT ${parts.weekday} ${parts.hour}:${String(parts.minute).padStart(2, "0")})`
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} eligibility cases passed`);
