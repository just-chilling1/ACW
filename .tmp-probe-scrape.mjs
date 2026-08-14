import { config } from "dotenv";
config({ path: ".env.local" });

const key = process.env.RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_HOST_SCRAPER || "the-web-scraping-api.p.rapidapi.com";

async function hit(label, pathAndQuery) {
  const url = `https://${host}${pathAndQuery}`;
  const r = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": host,
      "Content-Type": "application/json",
    },
  });
  const text = await r.text();
  console.log(`\n${label}: status=${r.status}`);
  console.log(text.slice(0, 400).replace(/\s+/g, " "));
}

const google = encodeURIComponent("https://www.google.com/search?q=site:reddit.com+puppy+biting");
const reddit = encodeURIComponent("https://www.reddit.com/search/?q=puppy%20biting&type=link&sort=new");
const httpbin = encodeURIComponent("https://httpbin.org/html");

await hit("browser httpbin", `/browser?url=${httpbin}&country=us&method=GET&screenshot=false&fullScreenshot=false`);
await hit("browser google", `/browser?url=${google}&country=us&method=GET&screenshot=false&fullScreenshot=false`);
await hit("normal google", `/normal?url=${google}&country=us&method=GET`);
await hit("browser reddit", `/browser?url=${reddit}&country=us&method=GET&screenshot=false&fullScreenshot=false`);
await hit("normal reddit", `/normal?url=${reddit}&country=us&method=GET`);
