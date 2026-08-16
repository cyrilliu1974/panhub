#!/usr/bin/env node
// sort-source.mjs  v1.0.0
// ---------------------------------------------------------------------------
// 1) 若 source.csv 尚未含「复仇者联盟」系列，補上 4 部核心電影（容量留空 N/A）。
// 2) 將整份清單重排：同一子系列歸為一組、組內依上映年排序、
//    組間依該系列最早上映年升冪排列；單片（自成 1 組）統一墊底、依片名排序。
//
// 設計：系列歸類以「英文名前綴 + 中文關鍵字」雙重比對，優先英文名。
// 可重跑：重跑結果穩定（Avengers 已存在則不重複新增）。
//
// 用法：node sort-source.mjs [csvPath]
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV = process.argv[2] || path.join(__dirname, "source.csv");

// ---------- 工具 ----------
function yearOf(en) {
  const m = (en || "").match(/\b((?:19|20)\d{2})\b/);
  return m ? parseInt(m[1], 10) : 0;
}
function norm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// ---------- 系列比對（en 前綴優先，cn 關鍵字兜底）----------
// 每條：{ key, en:/regex/ 或 enExact:Set, cn:/regex/ }
const SERIES = [
  { key: "Star Wars / 星球大战", en: /^Star Wars/, cn: /星球大战|星战/ },
  { key: "Star Trek / 星际迷航", en: /^Star Trek/, cn: /星际迷航/ },
  { key: "Alien / 异形", en: /^Alien|^Aliens|^Alien vs|^Aliens vs|^Predator/, cn: /异形|普罗米修斯|异形前传|終極戰士/ },
  { key: "Avatar / 阿凡达", en: /^Avatar/, cn: /阿凡达/ },
  { key: "Mad Max / 疯狂的麦克斯", en: /^Mad Max|^Furiosa/, cn: /疯狂的麦克斯|麦克斯/ },
  { key: "Fast & Furious / 速度与激情", en: /^Fast & Furious|^The Fast and the Furious|^2 Fast 2 Furious|^F9|^Fast X|Tokyo Drift|Hobbs & Shaw/, cn: /速度与激情|玩命关頭/ },
  { key: "Transformers / 变形金刚", en: /^Transformers|^Bumblebee/, cn: /变形金刚|大黄蜂/ },
  { key: "Jurassic / 侏罗纪", en: /^Jurassic/, cn: /侏罗纪/ },
  { key: "Harry Potter / 哈利波特", en: /^Harry Potter/, cn: /哈利波特/ },
  { key: "Fantastic Beasts / 怪兽", en: /^Fantastic Beasts/, cn: /怪兽/ },
  { key: "Hunger Games / 饥饿游戏", en: /^The Hunger Games/, cn: /饥饿游戏/ },
  { key: "Game of Thrones / 权力的游戏", en: /^Game of Thrones/, cn: /权力的游戏|冰与火之歌/ },
  { key: "LOTR / 魔戒", en: /^The Lord of the Rings/, cn: /魔戒|指环王/ },
  { key: "Hobbit / 霍比特人", en: /^The Hobbit/, cn: /霍比特人/ },
  { key: "Indiana Jones / 印第安納瓊斯", en: /^Indiana Jones/, cn: /印第安納瓊斯|奪寶奇兵/ },
  { key: "Pirates of the Caribbean / 加勒比海盜", en: /^Pirates of the Caribbean/, cn: /加勒比海盜/ },
  { key: "Planet of the Apes / 人猿星球", en: /Planet of the Apes/, cn: /人猿星球|猩球/ },
  { key: "MonsterVerse / 哥吉拉", en: /^Godzilla|^Kong: Skull Island/, cn: /哥吉拉|怪獸之王|金剛：骷髏島/ },
  { key: "Rambo / 藍波", en: /^Rambo|^First Blood/, cn: /藍波|第一滴血/ },
  { key: "Die Hard / 終極警探", en: /^Die Hard/, cn: /終極警探|虎膽龍威/ },
  { key: "Bourne / 神鬼認證", en: /^The Bourne|^Bourne|Jason Bourne/, cn: /神鬼認證|傑森包恩/ },
  { key: "Rocky / 洛基", en: /^Rocky|^Creed/, cn: /洛基|金牌拳手|CREED/ },
  { key: "X-Men / X战警", en: /^X-Men|^X2|^X-Men:|^The Wolverine|^Logan/, cn: /X战警|金钢狼|罗根/ },
  { key: "Mission: Impossible / 碟中谍", en: /^Mission: Impossible/, cn: /碟中谍/ },
  { key: "Terminator / 终结者", en: /^Terminator/, cn: /终结者|未来战士/ },
  { key: "James Bond / 007", enExact: new Set(["Casino Royale", "Quantum of Solace", "Skyfall", "Spectre", "No Time to Die"]), cn: /007/ },
  { key: "Resident Evil / 生化危机", en: /^Resident Evil/, cn: /生化危机|恶灵古堡/ },
  { key: "Matrix / 黑客帝国", en: /^The Matrix/, cn: /黑客帝国/ },
  { key: "Maze Runner / 移动迷宫", en: /^Maze Runner/, cn: /移动迷宫/ },
  { key: "Iron Man / 钢铁侠", en: /^Iron Man/, cn: /钢铁侠/ },
  { key: "Thor / 雷神", en: /^Thor/, cn: /雷神/ },
  { key: "Guardians / 银河护卫队", en: /^Guardians of the Galaxy/, cn: /银河护卫队|星际异攻队/ },
  { key: "Venom / 毒液", en: /^Venom/, cn: /毒液/ },
  { key: "Deadpool / 死侍", en: /^Deadpool/, cn: /死侍/ },
  { key: "Black Panther / 黑豹", en: /^Black Panther/, cn: /黑豹/ },
  { key: "Avengers / 复仇者联盟", en: /^Avengers/, cn: /复仇者联盟/ },
  { key: "Tron / 创", en: /^Tron/, cn: /^创|创：/ },
  { key: "Blade Runner / 银翼杀手", en: /^Blade Runner/, cn: /银翼杀手/ },
  { key: "Gladiator / 角斗士", en: /^Gladiator/, cn: /角斗士/ },
  { key: "John Wick / 疾速追杀", en: /^John Wick/, cn: /疾速追杀|杀神John Wick|捍卫任务/ },
  { key: "Warcraft / 魔兽", en: /^Warcraft/, cn: /魔兽/ },
  { key: "Final Fantasy / 最终幻想", en: /^Final Fantasy/, cn: /最终幻想/ },
  { key: "Alita / 阿丽塔", en: /^Alita/, cn: /阿丽塔|铳梦/ },
  { key: "The Last of Us / 最后生还者", en: /^The Last of Us/, cn: /最后生还者|美国末日/ },
  { key: "Ready Player One / 头号玩家", en: /^Ready Player One/, cn: /头号玩家/ },
  { key: "Top Gun / 壮志凌云", en: /^Top Gun/, cn: /壮志凌云/ },
  { key: "Dunkirk / 敦刻尔克", en: /^Dunkirk/, cn: /敦刻尔克/ },
  { key: "Saving Private Ryan / 拯救大兵瑞恩", en: /^Saving Private Ryan/, cn: /拯救大兵瑞恩|雷霆救兵/ },
  { key: "The Fifth Element / 第五元素", en: /^The Fifth Element/, cn: /第五元素/ },
  { key: "Ad Astra / 星际探索", en: /^Ad Astra/, cn: /星际探索|星际任务|星际救援/ },
  { key: "Finch / 芬奇", en: /^Finch/, cn: /芬奇/ },
  { key: "Hunger Games / 饥饿游戏", en: /^The Hunger Games/, cn: /饥饿游戏/ },
];

function seriesKey(en, cn) {
  const e = (en || "").trim();
  const c = cn || "";
  for (const s of SERIES) {
    if (s.enExact) {
      if (s.enExact.has(e)) return s.key;
    } else if (s.en && s.en.test(e)) {
      return s.key;
    }
    if (s.cn && s.cn.test(c)) return s.key;
  }
  return "ZZZ_" + (cn || en || "未知"); // 兜底：自成單組（單片），墊底
}

// ---------- 解析 ----------
function readRows(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
    if (/^中文名/.test(line)) continue;
    const m = line.match(/^(.*),(.*),(.*)$/);
    if (!m) {
      console.warn(`  [warn] 無法解析列，略過: ${line.slice(0, 60)}`);
      continue;
    }
    rows.push({ cn: m[1].trim(), en: m[2].trim(), cap: m[3].trim() });
  }
  return rows;
}

// ---------- 待補系列（不存在才新增，可重跑）----------
// 每筆：{ cn, en, cap }；容量留空 N/A 為本專案慣例。
const ADDITIONS = [
  // 復仇者聯盟（核心 4 部）
  { cn: "复仇者联盟", en: "The Avengers (2012)", cap: "" },
  { cn: "复仇者联盟2：奥创纪元", en: "Avengers: Age of Ultron (2015)", cap: "" },
  { cn: "复仇者联盟3：无限战争", en: "Avengers: Infinity War (2018)", cap: "" },
  { cn: "复仇者联盟4：终局之战", en: "Avengers: Endgame (2019)", cap: "" },
  // 飢餓遊戲（核心 4 部；2023 前傳已在檔案中）
  { cn: "饥饿游戏", en: "The Hunger Games (2012)", cap: "" },
  { cn: "饥饿游戏2：星火燎原", en: "The Hunger Games: Catching Fire (2013)", cap: "" },
  { cn: "饥饿游戏3：自由幻梦（上）", en: "The Hunger Games: Mockingjay - Part 1 (2014)", cap: "" },
  { cn: "饥饿游戏3：自由幻梦（下）", en: "The Hunger Games: Mockingjay - Part 2 (2015)", cap: "" },
  // 動作冒險經典
  { cn: "印第安納瓊斯：法櫃奇兵", en: "Raiders of the Lost Ark (1981)", cap: "" },
  { cn: "印第安納瓊斯：魔宮傳奇", en: "Indiana Jones and the Temple of Doom (1984)", cap: "" },
  { cn: "印第安納瓊斯：聖戰奇兵", en: "Indiana Jones and the Last Crusade (1989)", cap: "" },
  { cn: "印第安納瓊斯：水晶骷髏王國", en: "Indiana Jones and the Kingdom of the Crystal Skull (2008)", cap: "" },
  { cn: "印第安納瓊斯：命運轉輪", en: "Indiana Jones and the Dial of Destiny (2023)", cap: "" },
  { cn: "加勒比海盜：鬼盜船魔咒", en: "Pirates of the Caribbean: The Curse of the Black Pearl (2003)", cap: "" },
  { cn: "加勒比海盜2：聚魂棺", en: "Pirates of the Caribbean: Dead Man's Chest (2006)", cap: "" },
  { cn: "加勒比海盜3：世界的盡頭", en: "Pirates of the Caribbean: At World's End (2007)", cap: "" },
  { cn: "加勒比海盜4：驚濤怪浪", en: "Pirates of the Caribbean: On Stranger Tides (2011)", cap: "" },
  { cn: "加勒比海盜5：死無對證", en: "Pirates of the Caribbean: Dead Men Tell No Tales (2017)", cap: "" },
  { cn: "猩球崛起", en: "Rise of the Planet of the Apes (2011)", cap: "" },
  { cn: "猩球崛起2：黎明之戰", en: "Dawn of the Planet of the Apes (2014)", cap: "" },
  { cn: "猩球崛起3：終極決戰", en: "War for the Planet of the Apes (2017)", cap: "" },
  { cn: "王國降臨", en: "Kingdom of the Planet of the Apes (2024)", cap: "" },
  { cn: "哥吉拉", en: "Godzilla (2014)", cap: "" },
  { cn: "金剛：骷髏島", en: "Kong: Skull Island (2017)", cap: "" },
  { cn: "哥吉拉2：怪獸之王", en: "Godzilla: King of the Monsters (2019)", cap: "" },
  { cn: "哥吉拉對金剛", en: "Godzilla vs. Kong (2021)", cap: "" },
  { cn: "哥吉拉與金剛：新帝國", en: "Godzilla x Kong: The New Empire (2024)", cap: "" },
  { cn: "第一滴血", en: "First Blood (1982)", cap: "" },
  { cn: "第一滴血2", en: "Rambo: First Blood Part II (1985)", cap: "" },
  { cn: "第一滴血3", en: "Rambo III (1988)", cap: "" },
  { cn: "藍波：最後一滴血", en: "Rambo (2008)", cap: "" },
  { cn: "藍波：最後一戰", en: "Rambo: Last Blood (2019)", cap: "" },
  { cn: "終極警探", en: "Die Hard (1988)", cap: "" },
  { cn: "終極警探2", en: "Die Hard 2 (1990)", cap: "" },
  { cn: "終極警探3", en: "Die Hard with a Vengeance (1995)", cap: "" },
  { cn: "終極警探4", en: "Live Free or Die Hard (2007)", cap: "" },
  { cn: "終極警探5", en: "A Good Day to Die Hard (2013)", cap: "" },
  { cn: "神鬼認證", en: "The Bourne Identity (2002)", cap: "" },
  { cn: "神鬼認證2", en: "The Bourne Supremacy (2004)", cap: "" },
  { cn: "神鬼認證3", en: "The Bourne Ultimatum (2007)", cap: "" },
  { cn: "神鬼認證4", en: "The Bourne Legacy (2012)", cap: "" },
  { cn: "神鬼認證：傑森包恩", en: "Jason Bourne (2016)", cap: "" },
  { cn: "洛基", en: "Rocky (1976)", cap: "" },
  { cn: "洛基2", en: "Rocky II (1979)", cap: "" },
  { cn: "洛基3", en: "Rocky III (1982)", cap: "" },
  { cn: "洛基4", en: "Rocky IV (1985)", cap: "" },
  { cn: "洛基5", en: "Rocky V (1990)", cap: "" },
  { cn: "洛基：勇者無懼", en: "Rocky Balboa (2006)", cap: "" },
  { cn: "金牌拳手", en: "Creed (2015)", cap: "" },
  { cn: "金牌拳手2", en: "Creed II (2018)", cap: "" },
  { cn: "金牌拳手3", en: "Creed III (2023)", cap: "" },
  { cn: "終極戰士", en: "Predator (1987)", cap: "" },
  { cn: "終極戰士2", en: "Predator 2 (1990)", cap: "" },
  { cn: "終極戰士3：掠奪者", en: "Predators (2010)", cap: "" },
  { cn: "終極戰士：獸獵", en: "The Predator (2018)", cap: "" },
];

// ---------- 主流程 ----------
const rows = readRows(CSV);
console.log(`讀取 ${rows.length} 筆`);

// 補系列（若不存在）
const existingIds = new Set(rows.map((r) => norm(r.cn) + "|" + norm(r.en)));
let added = 0;
for (const a of ADDITIONS) {
  const id = norm(a.cn) + "|" + norm(a.en);
  if (existingIds.has(id)) continue;
  rows.push(a);
  added++;
}
if (added) console.log(`  新增 ${added} 筆系列電影`);
else console.log(`  待補系列皆已存在，跳過新增`);

// 歸類 + 年份
for (const r of rows) {
  r.key = seriesKey(r.en, r.cn);
  r.year = yearOf(r.en);
}

// 分組
const groups = new Map();
for (const r of rows) {
  if (!groups.has(r.key)) groups.set(r.key, []);
  groups.get(r.key).push(r);
}

const multi = [];
const singles = [];
for (const [key, list] of groups) {
  list.sort((a, b) => a.year - b.year || norm(a.en).localeCompare(norm(b.en)));
  if (list.length > 1) multi.push(list);
  else singles.push(list[0]);
}

// 組間：最早上映年升冪；單片：依片名（cn）升冪，墊底
multi.sort((A, B) => Math.min(...A.map((x) => x.year)) - Math.min(...B.map((x) => x.year)) || A[0].key.localeCompare(B[0].key));
singles.sort((a, b) => norm(a.cn).localeCompare(norm(b.cn)) || norm(a.en).localeCompare(norm(b.en)));

const ordered = [...multi.flat(), ...singles];

// 去重檢查（以 cn+en 正規化）
const seen = new Set();
let dup = 0;
for (const r of ordered) {
  const id = norm(r.cn) + "|" + norm(r.en);
  if (seen.has(id)) dup++;
  seen.add(id);
}
if (dup > 0) console.warn(`  [warn] 偵測到 ${dup} 筆重複！`);

// 寫回
const out = ["中文名,英文名,影片容量", ...ordered.map((r) => `${r.cn},${r.en},${r.cap}`)].join("\n") + "\n";
fs.writeFileSync(CSV, out, "utf8");

// 摘要
console.log(`寫回 ${ordered.length} 筆，分為 ${groups.size} 組（多片組 ${multi.length} + 單片 ${singles.length}）`);
console.log("--- 系列順序預覽 ---");
for (const list of multi) {
  const minY = Math.min(...list.map((x) => x.year));
  console.log(`[${minY}] ${list[0].key}  (${list.length} 部)`);
}
console.log(`[單片] 共 ${singles.length} 部，依片名墊底`);
