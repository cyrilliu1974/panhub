import fs from "node:fs";
const raw = fs.readFileSync("source.csv", "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const rows = [];
for (const line of lines) {
  if (/^中文名/.test(line)) continue;
  const m = line.match(/^(.*),([^,]+),([^,]+)\s*$/);
  if (!m) { console.log("UNPARSED:", line.slice(0, 50)); continue; }
  rows.push({ cn: m[1].trim(), en: m[2].trim(), cap: m[3].trim() });
}
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9一-鿿]/g, "");
console.log("總筆數:", rows.length);

// 1) 重複偵測（英文欄正規化比對）
const seen = new Map();
const dups = [];
rows.forEach((r, i) => {
  const k = norm(r.en);
  if (seen.has(k)) dups.push({ a: seen.get(k), b: { i, ...r } });
  else seen.set(k, { i, ...r });
});
console.log("\n=== 疑似重複（英文欄相同）===");
if (dups.length === 0) console.log("無");
dups.forEach((d) =>
  console.log(`  #${d.b.i} "${d.b.cn}" / "${d.b.en}" (${d.b.cap})  <=>  #${d.a.i} "${d.a.cn}" / "${d.a.en}" (${d.a.cap})`)
);

// 2) 僅中文名（英文缺失）
console.log("\n=== 僅中文名（英文為空）===");
const cnOnly = rows.filter((r) => !r.en || !r.en.trim());
console.log(cnOnly.length ? cnOnly.map((r) => `  # ${r.cn} (${r.cap})`).join("\n") : "無");

// 3) 系列分組
const seriesMap = {
  "玩命關頭/速度與激情": ["速度與激情", "玩命關頭", "fast", "furious"],
  "星際迷航": ["星際迷航", "star trek"],
  "瘋狂的麥克斯": ["瘋狂的麥克斯", "mad max"],
  "銀河護衛隊": ["銀河護衛隊", "guardians"],
  "侏羅紀": ["侏羅紀", "jurassic"],
  "變形金剛": ["變形金剛", "transformers"],
  "異形": ["異形", "alien"],
  "鋼鐵人": ["鋼鐵俠", "iron man"],
  "終結者": ["終結者", "未來戰士", "terminator"],
  "不可能的任務/碟中諜": ["碟中諜", "不可能的任務", "mission: impossible", "mission impossible"],
  "007": ["007", "詹姆", "james bond", "quantum of solace", "casino royale", "skyfall", "spectre"],
  "哈利波特": ["哈利波特", "哈利·波特", "harry"],
  "權力遊戲/冰與火之歌": ["權力遊戲", "冰與火之歌", "game of thrones"],
  "魔戒/指環王": ["魔戒", "指環王", "lord of the rings"],
  "哈比人": ["哈比人", "霍比特人", "hobbit"],
  "毒液": ["毒液", "venom"],
  "角鬥士": ["角鬥士", "gladiator"],
  "死侍": ["死侍", "deadpool"],
  "黑豹": ["黑豹", "black panther"],
  "X戰警": ["x戰警", "x-men", "xmen"],
  "星際大戰/星戰": ["星際大戰", "星戰", "star wars"],
};
console.log("\n=== 系列分布 ===");
for (const [name, kws] of Object.entries(seriesMap)) {
  if (!kws.length) continue;
  const hit = rows.filter((r) => {
    const t = (r.cn + " " + r.en).toLowerCase();
    return kws.some((k) => k && t.includes(k.toLowerCase()));
  });
  if (hit.length)
    console.log(`\n[${name}] (${hit.length} 筆)` + hit.map((h) => `\n   - ${h.cn} | ${h.en} | ${h.cap}`).join(""));
}
