import { config } from "dotenv";
config({ path: ".env.local" });

const NEW_KEY = "e7e3cea957mshc82e2905742c405p1bc369jsnc48d964a56ee";
const OLD_KEY = process.env.RAPIDAPI_KEY;
const hosts = {
  reddit: process.env.RAPIDAPI_HOST_REDDIT || "reddit-api.p.rapidapi.com",
  youtube: process.env.RAPIDAPI_HOST_YOUTUBE || "youtube-v31.p.rapidapi.com",
  chatgpt: process.env.RAPIDAPI_HOST_CHATGPT || "chatgpt-42.p.rapidapi.com",
  scrape: "the-web-scraping-api.p.rapidapi.com",
};

async function probe(label, key, url, host, init = {}) {
  try {
    const r = await fetch(url, {
      ...init,
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
        ...(init.headers || {}),
      },
    });
    const text = await r.text();
    console.log(`${label}: status=${r.status} body=${text.slice(0, 120).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`${label}: ERROR ${e.message}`);
  }
}

const redditUrl = `https://${hosts.reddit}/search?query=puppy&sort=relevance&time=month`;
const ytUrl = `https://${hosts.youtube}/search?q=puppy&part=snippet&maxResults=3`;
const chatUrl = `https://${hosts.chatgpt}/chat`;
const scrapeUrl = `https://${hosts.scrape}/browser?url=${encodeURIComponent("https://httpbin.org/get")}&country=us&method=GET&screenshot=false&fullScreenshot=false`;

for (const [name, key] of [
  ["OLD", OLD_KEY],
  ["NEW", NEW_KEY],
]) {
  console.log(`\n==== ${name} key ====`);
  await probe(`${name} reddit`, key, redditUrl, hosts.reddit);
  await probe(`${name} youtube`, key, ytUrl, hosts.youtube);
  await probe(
    `${name} chatgpt`,
    key,
    chatUrl,
    hosts.chatgpt,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say hi in 3 words" }],
        model: "gpt-4o-mini",
      }),
    },
  );
  await probe(`${name} webscrape`, key, scrapeUrl, hosts.scrape);
}
