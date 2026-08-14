import { config } from "dotenv";
import * as cheerio from "cheerio";
config({ path: ".env.local" });

const key = process.env.RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_HOST_SCRAPER || "the-web-scraping-api.p.rapidapi.com";
const target = encodeURIComponent("https://www.reddit.com/search/?q=puppy%20biting&type=link&sort=new&t=month");
const url = `https://${host}/browser?url=${target}&country=us&method=GET&screenshot=false&fullScreenshot=false`;
const r = await fetch(url, {
  headers: { "x-rapidapi-key": key, "x-rapidapi-host": host, "Content-Type": "application/json" },
});
const json = await r.json();
const html = json.data || "";
const $ = cheerio.load(html);
const hrefs = new Set();
$("a[href]").each((_, el) => {
  const href = $(el).attr("href") || "";
  if (/\/r\/[^/]+\/comments\//i.test(href)) hrefs.add(href.split("?")[0]);
});
console.log("comment links", hrefs.size);
console.log([...hrefs].slice(0, 15).join("\n"));
// Also dump faceplate / shadow patterns
const faceplate = html.match(/\/r\/[\w+]+\/comments\/[\w]+\/[\w-]+/g) || [];
console.log("regex matches", new Set(faceplate).size);
console.log([...new Set(faceplate)].slice(0, 10).join("\n"));
