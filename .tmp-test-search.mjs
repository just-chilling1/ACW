import { config } from "dotenv";
config({ path: ".env.local" });

const { searchSocialData } = await import("./src/lib/rapidapi.ts");

const posts = await searchSocialData("puppy biting");
console.log(`OK count=${posts.length}`);
for (const p of posts.slice(0, 5)) {
  console.log(`- ${p.platform} | ${p.title?.slice(0, 80)} | ${p.url}`);
}
