import { config } from "dotenv";
import * as cheerio from "cheerio";
config({ path: ".env.local" });

const key = process.env.RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_HOST_SCRAPER || "the-web-scraping-api.p.rapidapi.com";

async function scrape(target) {
  const url = `https://${host}/browser?url=${encodeURIComponent(target)}&country=us&method=GET&screenshot=false&fullScreenshot=false`;
  const r = await fetch(url, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": host, "Content-Type": "application/json" },
  });
  const json = await r.json();
  return json.data || "";
}

for (const target of [
  "https://old.reddit.com/search?q=puppy+biting&restrict_sr=&sort=new&t=month",
  "https://www.reddit.com/search/?q=puppy%20biting&type=link&sort=new&t=month",
]) {
  console.log("\n====", target);
  const html = await scrape(target);
  const $ = cheerio.load(html);
  const rows = [];
  $("a[href*='/comments/']").each((_, el) => {
    const href = ($(el).attr("href") || "").split("?")[0];
    if (!/\/r\/[^/]+\/comments\//i.test(href)) return;
    const title = $(el).text().trim().replace(/\s+/g, " ").slice(0, 120);
    rows.push({ href, title });
  });
  console.log("anchors", rows.length);
  console.log(rows.slice(0, 8));
}
