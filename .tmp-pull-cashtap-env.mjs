import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), ".tmp-vercel-env");
mkdirSync(root, { recursive: true });

const projects = ["cashtapai", "cashtap-modified", "ai-cash-wave", "acw"];
const keys = [
  "RAPIDAPI_KEY",
  "RAPIDAPI_HOST_REDDIT",
  "RAPIDAPI_HOST_YOUTUBE",
  "RAPIDAPI_HOST_CHATGPT",
  "SCRAPERAPI_KEY",
  "SCRAPER_API_KEY",
];

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", shell: true });
  return { status: r.status, out: `${r.stdout || ""}\n${r.stderr || ""}` };
}

for (const p of projects) {
  const dir = join(root, p);
  mkdirSync(dir, { recursive: true });
  console.log(`\n===== ${p} =====`);
  const link = run(
    "vercel",
    ["link", "--yes", "--project", p, "--scope", "essams-projects-52baa131"],
    dir,
  );
  console.log(link.out.split("\n").slice(-8).join("\n"));
  const pull = run(
    "vercel",
    ["env", "pull", ".env.pulled", "--environment", "production", "--yes"],
    dir,
  );
  console.log(pull.out.split("\n").slice(-8).join("\n"));
  const envPath = join(dir, ".env.pulled");
  if (!existsSync(envPath)) {
    console.log("NO ENV FILE");
    continue;
  }
  const e = readFileSync(envPath, "utf8");
  for (const k of keys) {
    const m = e.match(new RegExp(`^${k}=(.*)$`, "m"));
    const v = (m?.[1] || "").trim().replace(/^["']|["']$/g, "");
    console.log(
      v
        ? `${k}: SET len=${v.length} prefix=${v.slice(0, 8)}`
        : `${k}: MISSING`,
    );
  }
}

writeFileSync(join(root, "done.txt"), new Date().toISOString());
