const REGENERATION_HOST = "chatgpt-42.p.rapidapi.com";
const OPENAI_MODEL = "gpt-4o-mini";

async function callOpenAI(
    messages: { role: string; content: string }[],
    timeoutMs = readTimeoutMs(),
) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL?.trim() || OPENAI_MODEL,
                messages,
                temperature: 0.8,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || null;
        if (!result) {
            throw new Error("OpenAI API Error: Unexpected response structure");
        }
        return typeof result === "string" ? result : JSON.stringify(result);
    } finally {
        clearTimeout(timeout);
    }
}

function readTimeoutMs(): number {
    const raw = Number(process.env.LLM_TIMEOUT_MS);
    return Number.isFinite(raw) && raw >= 5000 ? raw : 25000;
}

async function callChatGPTWithHost(
    messages: { role: string; content: string }[],
    host: string,
    timeoutMs = readTimeoutMs(),
) {
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
        throw new Error("Missing RAPIDAPI_KEY for ChatGPT");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`https://${host}/gpt4`, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': host,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                web_access: false
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ChatGPT API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`ChatGPT API Response (${host}):`, JSON.stringify(data).substring(0, 200) + "...");

        const result = data.result || data.choices?.[0]?.message?.content || data.response || null;

        if (!result) {
            console.error("ChatGPT API Error: Unexpected response structure", data);
            throw new Error("ChatGPT API Error: Unexpected response structure");
        }

        return typeof result === 'string' ? result : JSON.stringify(result);
    } finally {
        clearTimeout(timeout);
    }
}

export type CallChatGPTOptions = { timeoutMs?: number };

export async function callChatGPT(
    messages: { role: string; content: string }[],
    options?: CallChatGPTOptions,
) {
    const timeoutMs = options?.timeoutMs ?? readTimeoutMs();
    const preferOpenAI = process.env.LLM_PROVIDER?.trim().toLowerCase() === "openai";
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
    const hasRapid = Boolean(process.env.RAPIDAPI_KEY?.trim());

    // Prefer explicit provider; otherwise RapidAPI first (existing default), OpenAI fallback.
    if (preferOpenAI && hasOpenAI) {
        return callOpenAI(messages, timeoutMs);
    }

    if (hasRapid) {
        try {
            const host = process.env.RAPIDAPI_HOST_CHATGPT || REGENERATION_HOST;
            return await callChatGPTWithHost(messages, host, timeoutMs);
        } catch (err) {
            if (!hasOpenAI) throw err;
            console.warn("[llm] RapidAPI ChatGPT failed; falling back to OpenAI:", err);
            return callOpenAI(messages, timeoutMs);
        }
    }

    if (hasOpenAI) {
        return callOpenAI(messages, timeoutMs);
    }

    throw new Error("Missing RAPIDAPI_KEY or OPENAI_API_KEY for ChatGPT");
}

/** Regeneration endpoints always use chatgpt-42.p.rapidapi.com (OpenAI fallback if needed). */
export async function callChatGPTForRegeneration(messages: { role: string; content: string }[]) {
    const hasRapid = Boolean(process.env.RAPIDAPI_KEY?.trim());
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

    if (hasRapid) {
        try {
            return await callChatGPTWithHost(messages, REGENERATION_HOST);
        } catch (err) {
            if (!hasOpenAI) throw err;
            console.warn("[llm] RapidAPI regeneration failed; falling back to OpenAI:", err);
            return callOpenAI(messages);
        }
    }

    if (hasOpenAI) return callOpenAI(messages);
    throw new Error("Missing RAPIDAPI_KEY or OPENAI_API_KEY for ChatGPT");
}

export async function expandKeywords(keyword: string): Promise<string[]> {
    const prompt = `Act as a marketing expert. Expand the keyword "${keyword}" into 10-12 specific, high-intent social media search variations. Return ONLY a JSON array of strings. No conversational text. Example: ["Keyword 1", "Keyword 2"]`;

    const result = await callChatGPT([{ role: "user", content: prompt }]);
    try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse keyword variations:", result);
        throw new Error("Failed to process market variations. Please try again.");
    }
}

export async function classifyActivity(keyword: string, sampleData: string): Promise<{ level: string; count: number; classification: string; type: string }> {
    const hasData = sampleData && sampleData.trim().length > 0;

    const prompt = hasData
        ? `Analyze this social media data for "${keyword}":\n${sampleData}\n\nTasks:\n1. Determine Activity Level based on ad/discussion volume and engagement.\n2. Count total ads/discussions/comments accurately.\n3. Identify the PRIMARY Conversation Type (MUST be exactly one of: Questions, Complaints, Recommendations).\n4. Write a SPECIFIC and UNIQUE 2-sentence analysis of the discussions. Be specific to the niche "${keyword}".\n\nReturn ONLY a JSON object: {"level": "...", "count": 12, "type": "Questions/Complaints/Recommendations", "classification": "..."}`
        : `You are a market research expert. Analyze the niche "${keyword}" based on online trends.\n\nTasks:\n1. Estimate Activity Level (Low, Active, High).\n2. Estimate a realistic 7-day ad/discussion count.\n3. Identify the PRIMARY Conversation Type for this niche (MUST be exactly one of: Questions, Complaints, Recommendations).\n4. Write a SPECIFIC and UNIQUE 2-sentence analysis of pain points or recommendations in the "${keyword}" space. Be concrete.\n\nReturn ONLY a JSON object: {"level": "...", "count": 12, "type": "Questions/Complaints/Recommendations", "classification": "..."}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        const cleaned = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("classifyActivity failed, using fallback:", e);
        const angles = [
            { type: "Questions", text: `Users searching for "${keyword}" are primarily looking for comparisons, honest reviews, and step-by-step guides. Common frustrations include outdated information and conflicting advice.` },
            { type: "Recommendations", text: `The "${keyword}" community is actively sharing personal experiences and top picks. Most discussions revolve around cost-effectiveness and getting started easily.` },
            { type: "Complaints", text: `Discussion around "${keyword}" often centers on troubleshooting common issues. Users frequently express frustration with expensive solutions that don't address their specific needs.` },
            { type: "Questions", text: `People interested in "${keyword}" are seeking actionable advice. The conversation is dominated by requests for budget-friendly alternatives and performance benchmarks.` },
            { type: "Recommendations", text: `The "${keyword}" niche shows engaged communities sharing workarounds and personal setups. Key themes include maximizing value and finding trustworthy expert opinions.` }
        ];
        const choice = angles[Math.floor(Math.random() * angles.length)];
        return {
            level: "Active",
            count: Math.floor(Math.random() * 40) + 15,
            type: choice.type,
            classification: choice.text
        };
    }
}


export async function generateReplies(posts: any[], affiliateLink: string): Promise<any[]> {
    const link = affiliateLink || "NONE PROVIDED";
    const postsJson = JSON.stringify(
        posts.map((p) => ({
            id: p.id,
            text: String(p.text || "").slice(0, 500),
            title: p.title ? String(p.title).slice(0, 160) : undefined,
        })),
    );

    const prompt = `For each social media thread below, write 6 distinct reply variants a real person could paste.

TARGET LINK (include in every reply when provided): ${link}

Reply styles — return EXACTLY 6 replies in this order:
1. Short — 1–2 sentences, punchy, answers the thread, then the link
2. Detailed — 3–4 sentences with helpful context before recommending the link
3. Curiosity — ends with a genuine question that invites discussion and includes the link naturally
4. Empathetic — acknowledges their frustration/goal first, then offers the resource gently
5. Expert tip — one practical tip related to the thread, then the link as a deeper walkthrough
6. Soft recommend — low-pressure suggestion ("worth a look if…"), never hypey

Quality rules:
- First address the specific thread topic — do NOT open with a product pitch
- Sound like a helpful peer on Reddit/Facebook, not an ad
- Do NOT invent personal earnings, testimonials, guarantees, or fake "I tried this" stories
- Do NOT use prefixes like "Short:" or "Style 1:"
- Weave the link naturally (e.g. "this breakdown helped: ${link}")
- Each of the 6 replies must use different wording and structure

Threads:
${postsJson}

Return ONLY a JSON array:
[{"id":"post_id","replies":["short","detailed","curiosity","empathetic","expert","soft"]}]`;

    const result = await callChatGPT([{ role: "user", content: prompt }]);
    try {
        const cleaned = result.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((row: { id?: string; replies?: unknown }) => ({
            id: row.id,
            replies: Array.isArray(row.replies)
                ? row.replies.map(String).filter((r) => r.trim()).slice(0, 6)
                : [],
        }));
    } catch (e) {
        console.error("Generation failed:", result);
        return [];
    }
}
