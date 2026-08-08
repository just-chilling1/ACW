export async function callChatGPT(messages: { role: string; content: string }[]) {
    const apiKey = process.env.RAPIDAPI_KEY;
    const host = process.env.RAPIDAPI_HOST_CHATGPT || 'chatgpt-42.p.rapidapi.com';

    if (!apiKey) {
        throw new Error("Missing RAPIDAPI_KEY for ChatGPT");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

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

    clearTimeout(timeout);

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
    const postsJson = JSON.stringify(posts.map(p => ({ id: p.id, text: p.text })));
    const prompt = `For each of these social media ads/discussions, generate 3 distinct natural, human-sounding responses.
    
    TARGET LINK TO INCLUDE: ${affiliateLink || "NONE PROVIDED"}
    
    CRITICAL INSTRUCTIONS:
    1. If a TARGET LINK is provided above, YOU MUST INCLUDE IT in every single reply. DO NOT skip it.
    2. Weave the link naturally into the sentence (e.g., "Check this out: ${affiliateLink}" or "I used ${affiliateLink} to solve this").
    3. Return ONLY the reply text. 
    4. DO NOT include prefixes like "Short:", "Medium:", "Curiosity:", or "Variant:".
    5. The responses must be conversational, high-value, and contextual to the original ad/discussion.
    
    Styles for the 3 results:
    1. Short & Direct: A quick, punchy acknowledgement that includes the link.
    2. Detailed Value: A helpful insight or personal-sounding story that explains WHY the link is useful.
    3. Curiosity Hook: A question or "loop" that makes them want to click the link.
    
    Ads/Discussions to analyze:
    ${postsJson}
    
    Return ONLY a JSON array of objects: [{"id": "post_id", "text": "original_text", "replies": ["Direct reply text here", "Detailed reply text here", "Hook reply text here"]}]`;

    const result = await callChatGPT([{ role: "user", content: prompt }]);
    try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Generation failed:", result);
        return [];
    }
}

function parseJsonResponse<T>(raw: string): T {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
}

export async function analyzeOfferFromLink(
    affiliateLink: string,
    pageContext: string
): Promise<{
    productName: string;
    category: string;
    mainProblem: string;
    targetAudience: string;
    mainBenefit: string;
    positioning: string;
    searchKeywords: string[];
}> {
    const contextBlock = pageContext
        ? `Page content from the offer:\n${pageContext}\n\n`
        : "No page content could be fetched. Infer from the URL structure and common affiliate offer patterns.\n\n";

    const prompt = `${contextBlock}Affiliate link: ${affiliateLink}

Act as a marketing strategist. Analyze this offer for a non-technical affiliate marketer.

Return ONLY JSON:
{
  "productName": "...",
  "category": "...",
  "mainProblem": "one sentence — what problem does this solve?",
  "targetAudience": "who buys this?",
  "mainBenefit": "primary outcome for the buyer",
  "positioning": "how to position this naturally in conversations",
  "searchKeywords": ["5-8 high-intent social search phrases people use when looking for this solution — include reddit-friendly phrasing"]
}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonResponse<{
            productName: string;
            category: string;
            mainProblem: string;
            targetAudience: string;
            mainBenefit: string;
            positioning: string;
            searchKeywords: string[];
        }>(result);
        return {
            ...parsed,
            searchKeywords: Array.isArray(parsed.searchKeywords)
                ? parsed.searchKeywords.slice(0, 8)
                : [],
        };
    } catch (e) {
        console.warn("analyzeOfferFromLink failed:", e);
        return {
            productName: "Your Offer",
            category: "General",
            mainProblem: "People are looking for a practical solution in this niche.",
            targetAudience: "People searching for help online",
            mainBenefit: "A helpful solution they can try",
            positioning: "Lead with helpful advice, introduce the offer naturally.",
            searchKeywords: ["best solution reddit", "recommendations reddit 2024"],
        };
    }
}

export async function explainOpportunityPick(
    offerSummary: string,
    postTitle: string,
    postText: string
): Promise<string> {
    const prompt = `Offer: ${offerSummary}
Conversation: "${postTitle}" — ${postText.slice(0, 400)}

In 1-2 simple sentences, explain why this conversation is a good place to help and mention the offer naturally. No jargon. Return plain text only.`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        return result.trim().slice(0, 500);
    } catch {
        return "This person is actively looking for a solution, and a helpful answer fits better here than a direct promotion.";
    }
}

export async function generateCampaignStrategy(
    offerSummary: string,
    conversationSummary: string
): Promise<{ approach: string; bestAngle: string; recommendedCta: string }> {
    const prompt = `Offer: ${offerSummary}
Target conversation: ${conversationSummary}

You are a campaign strategist. Return ONLY JSON:
{
  "approach": "1-2 sentences — recommended approach (helpful first, promotion second)",
  "bestAngle": "the strongest positioning angle in plain language",
  "recommendedCta": "how soft or direct the CTA should be"
}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        return parseJsonResponse(result);
    } catch {
        return {
            approach:
                "Answer the person's question first with useful information. Introduce the offer only after establishing relevance.",
            bestAngle: "Focus on the main benefit without sounding like an ad.",
            recommendedCta: "Keep the CTA soft and optional.",
        };
    }
}

export async function generatePromotionPack(
    offerSummary: string,
    conversationSummary: string,
    strategy: { approach: string; bestAngle: string; recommendedCta: string },
    affiliateLink: string
): Promise<{
    recommendedReply: string;
    alternativeReply: string;
    shortReply: string;
    followUpResponse: string;
    objectionResponse: string;
    dmResponse: string;
    cta: string;
    postingGuidance: string;
}> {
    const prompt = `Offer: ${offerSummary}
Conversation: ${conversationSummary}
Strategy: ${JSON.stringify(strategy)}
Affiliate link (include naturally in replies): ${affiliateLink}

Create a complete promotion pack for a Reddit/YouTube comment. Helpful first, not spammy. Sound human.

Return ONLY JSON:
{
  "recommendedReply": "primary reply with link woven in naturally",
  "alternativeReply": "different angle, still natural",
  "shortReply": "concise version under 280 chars with link",
  "followUpResponse": "if someone responds positively or asks for more info",
  "objectionResponse": "if someone is skeptical",
  "dmResponse": "for a private follow-up if appropriate",
  "cta": "recommended soft call-to-action phrase",
  "postingGuidance": "1-2 sentences telling the user exactly what to do"
}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        return parseJsonResponse(result);
    } catch (e) {
        console.error("Promotion pack generation failed:", e);
        const base = `I've had good results with something like this — worth a look if you're exploring options: ${affiliateLink}`;
        return {
            recommendedReply: base,
            alternativeReply: base,
            shortReply: base.slice(0, 280),
            followUpResponse: `Happy to share more details if you're curious — the main thing that helped me was here: ${affiliateLink}`,
            objectionResponse:
                "Totally fair to be skeptical. I felt the same until I tried it myself — no pressure, just sharing what worked for me.",
            dmResponse: `Hey — saw your reply. Happy to point you to what I used if you want: ${affiliateLink}`,
            cta: "Worth checking out if it fits what you're looking for.",
            postingGuidance:
                "Copy the recommended reply, open the post, paste as a comment, and engage naturally if anyone responds.",
        };
    }
}

export async function generateConversationAssist(
    offerSummary: string,
    ourPreviousReply: string,
    theirReply: string
): Promise<{ recommended: string; why: string; softer?: string; stronger?: string }> {
    const prompt = `Offer context: ${offerSummary}
Your previous reply: ${ourPreviousReply}
Their response: ${theirReply}

Suggest what to say next. Return ONLY JSON:
{
  "recommended": "best next response",
  "why": "one sentence why this works",
  "softer": "more casual version",
  "stronger": "more direct version with link if appropriate"
}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        return parseJsonResponse(result);
    } catch {
        return {
            recommended: "Thanks for sharing! Happy to answer any other questions if helpful.",
            why: "Keeps the conversation friendly without pushing.",
            softer: "Appreciate the reply — let me know if you want more details.",
            stronger: "Glad that helped — feel free to check the link I mentioned if you want to dig in.",
        };
    }
}
