#!/usr/bin/env node
/**
 * Structural Instant Income kit-build cost model.
 * No live LLM / Supabase — measures pipeline shape from source.
 *
 * estimated_wall_seconds ≈ (llm_waves * LLM_SEC) + (db_insert_round_trips * DB_SEC)
 * where parallel stages in one wave share one LLM_SEC slot.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const LLM_SEC = 8;
const DB_SEC = 0.04;

function read(rel) {
    const p = resolve(ROOT, rel);
    if (!existsSync(p)) return "";
    return readFileSync(p, "utf8");
}

function countMatches(src, re) {
    return [...src.matchAll(re)].length;
}

function measure() {
    const kitEngine = read("src/lib/instant/kit-engine.ts");
    const contentEngine = read("src/lib/instant/content-engine.ts");
    const types = read("src/lib/instant/types.ts");
    const kitPage = read("src/app/instant/kit/[id]/page.tsx");
    const fallbacks = read("src/lib/instant/fallbacks.ts");

    const hasBatchInsert =
        /insert\(\s*\[[\s\S]*?\]/.test(kitEngine) ||
        /insert\(rows\)/.test(kitEngine) ||
        /insert\(payload\)/.test(kitEngine) ||
        /\.insert\(payload\)/.test(kitEngine) ||
        /BATCH_INSERT|insertAssetsBatch|bulkInsert/i.test(kitEngine);

    const sequentialInsertLoop =
        /for\s*\(\s*const\s+asset\s+of\s+assets\s*\)/.test(kitEngine) &&
        !hasBatchInsert;

    // Content generation calls that typically need LLM
    const contentGenerators = [
        "generatePromotionAngles",
        "generatePromotionHooks",
        "generatePromotionPosts",
        "generatePromotionReplies",
        "generatePromotionCtas",
        "generateQuickPlan",
    ];
    const usedGenerators = contentGenerators.filter((g) => kitEngine.includes(g));

    // Parallel wave detection: Promise.all grouping of content gens
    const promiseAllBlocks = [...kitEngine.matchAll(/Promise\.all\(\s*\[([\s\S]*?)\]\s*\)/g)];
    let parallelStages = 0;
    const parallelized = new Set();
    for (const block of promiseAllBlocks) {
        const body = block[1] || "";
        for (const g of usedGenerators) {
            if (body.includes(g)) {
                parallelized.add(g);
                parallelStages += 1;
            }
        }
    }

    const sequentialGens = usedGenerators.filter((g) => !parallelized.has(g));
    // Waves = 1 per parallel group (if any gens parallelized) + 1 per remaining sequential gen
    const parallelWaves = parallelized.size > 0 ? 1 : 0;
    // If multiple Promise.all groups, count each
    const parallelGroupCount = promiseAllBlocks.filter((b) =>
        usedGenerators.some((g) => (b[1] || "").includes(g)),
    ).length;
    const llm_waves = (parallelGroupCount || parallelWaves) + sequentialGens.length;

    // Fallback asset counts (production minimum when LLM fails)
    const fallbackPostCount = countMatches(fallbacks, /platform:/g) || 10;
    const min_posts = Math.max(
        fallbackPostCount,
        /slice\(0,\s*12\)/.test(contentEngine) ? 8 : 8,
    );
    const min_replies = /slice\(0,\s*10\)/.test(contentEngine) || /buildFallbackReplies/.test(contentEngine)
        ? 6
        : 6;

    // Estimate insert round trips: sequential loop ≈ one per asset; batch ≈ one per type
    const assetTypesPerBuild = 5; // angle, hook, post, reply, cta
    const estimatedAssets = 5 + 12 + 12 + 8 + 6; // angles+hooks+posts+replies+ctas typical
    const db_insert_round_trips = hasBatchInsert
        ? assetTypesPerBuild
        : sequentialInsertLoop
          ? estimatedAssets
          : estimatedAssets;

    const redundant_analyze_risk =
        /analyzeOffer\(/.test(kitEngine) && /productName === "Your Offer"/.test(kitEngine)
            ? 0
            : /analyzeOffer\(/.test(kitEngine)
              ? 1
              : 0;

    const hasRecommendations = /buildRecommendations/.test(kitEngine) ? 1 : 0;
    const hasNextStepLoop = /Next step|allDone|startNextCycle/.test(kitPage) ? 1 : 0;
    const ux_step_count = countMatches(kitPage, /step === [1-4]/g) || 4;

    const estimated_wall_seconds =
        Math.round((llm_waves * LLM_SEC + db_insert_round_trips * DB_SEC) * 100) / 100;

    const structural_ok =
        usedGenerators.includes("generatePromotionPosts") &&
        usedGenerators.includes("generatePromotionReplies") &&
        hasRecommendations &&
        types.includes("create_posts")
            ? 1
            : 0;

    return {
        estimated_wall_seconds,
        structural_ok,
        min_posts,
        min_replies,
        llm_waves,
        db_insert_round_trips,
        parallel_content_stages: parallelized.size,
        redundant_analyze_risk,
        ux_step_count,
        has_next_step_loop: hasNextStepLoop,
        has_batch_insert: hasBatchInsert ? 1 : 0,
        content_generators: usedGenerators.length,
    };
}

const metrics = measure();
process.stdout.write(JSON.stringify(metrics, null, 2) + "\n");
