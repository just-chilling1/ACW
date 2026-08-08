import * as cheerio from "cheerio";
import { sanitizeExternalUrl } from "@/lib/safe-url";

export async function fetchOfferPageContext(url: string): Promise<string> {
  const safe = sanitizeExternalUrl(url);
  if (!safe) return "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(safe, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AICashWave/1.0)",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!response.ok) return "";

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    const h1 = $("h1").first().text().trim();
    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || "";

    return [ogTitle, title, h1, description]
      .filter(Boolean)
      .join("\n")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
  } catch {
    return "";
  }
}

export function isValidAffiliateLink(url: string): boolean {
  return Boolean(sanitizeExternalUrl(url));
}
