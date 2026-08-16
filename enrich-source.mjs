// enrich-source.mjs — 補全 source.csv：清理英文名、修正錯誤、補中文-only 列、去重、補系列缺口
// 直接覆寫 source.csv（備份見 source.csv.bak）。新增列「影片容量」留空（N/A）。
import { readFileSync, writeFileSync } from 'node:fs';

const input = readFileSync('source.csv', 'utf8');
const lines = input.split(/\r?\n/).filter(l => l.length > 0);

// ---- 1) CN 修正（英文名錯誤 / 缺漏 / 編號錯置）----
const cnFix = new Map([
  ['速度与激情2(4K原盘+含国语次世代)', { en: '2 Fast 2 Furious (2003)', cap: '' }],
  ['海王2：失落的王国/水行侠 失落王国(4K原盘+含国语次世代)', { en: 'Aquaman and the Lost Kingdom (2023)' }],
  ['星球大战前传1:魅影危机(4K原盘+含国语音轨)', { en: 'Star Wars: Episode I - The Phantom Menace (1999)' }],
  ['星球大战前传2：克隆人的进攻(4K原盘+含国语音轨)', { en: 'Star Wars: Episode II - Attack of the Clones (2002)' }],
  ['星球大战4：新希望/星球大战：曙光乍现(4K原盘+含国语音轨)', { en: 'Star Wars: Episode IV - A New Hope (1977)' }],
  ['权力的游戏/冰与火之歌 第二季(4K原盘)', { en: 'Game of Thrones Season 2 (2012)' }],
  ['阿凡达：水之道/阿凡达2/阿凡达2：水之道(含国语音轨)', { en: 'Avatar: The Way of Water (2022)' }],
  ['哈利波特7(下)/哈利·波特与死亡圣器(下)(4K原盘+含国语次世代)', { en: 'Harry Potter and the Deathly Hallows: Part 2 (2011)' }],
]);

// ---- 2) 僅有中文名的列 -> 補英文名 ----
const complete = new Map([
  ['星际迷航3', 'Star Trek III: The Search for Spock (1984)'],
  ['碟中谍1', 'Mission: Impossible (1996)'],
  ['碟中谍2', 'Mission: Impossible 2 (2000)'],
  ['碟中谍4', 'Mission: Impossible: Ghost Protocol (2011)'],
  ['碟中谍5', 'Mission: Impossible: Rogue Nation (2015)'],
  ['碟中谍6', 'Mission: Impossible: Fallout (2018)'],
]);

// ---- 3) 精確重複/錯誤列（移除）----
const remove = new Set([
  '星球大战1', '星球大战2', '星球大战3', '星球大战4', '星球大战5', '星球大战6',
  '碟中谍3',
  '碟中谍7：致命清算(下)/不可能的任务：致命清算',
  '侏罗纪世界：重生 / 侏罗纪世界4',
  '变形金刚：超能勇士崛起/变形金刚：万兽崛起/变形金刚：狂兽崛起',
]);

// ---- 4) 新增系列缺口（容量留空 N/A，含外傳/旁支/重啟）----
const additions = [
  ['速度与激情4', 'Fast & Furious (2009)', ''],
  ['速度与激情9', 'F9 (2021)', ''],
  ['速度与激情10', 'Fast X (2023)', ''],
  ['玩命關頭：特戰飛車手', 'Hobbs & Shaw (2019)', ''],
  ['星际迷航(重啟)', 'Star Trek (2009)', ''],
  ['星际迷航：暗黑无界', 'Star Trek Into Darkness (2013)', ''],
  ['星际迷航：浩瀚无垠', 'Star Trek Beyond (2016)', ''],
  ['疯狂的麦克斯', 'Mad Max (1979)', ''],
  ['疯狂的麦克斯：狂暴之路', 'Mad Max: Fury Road (2015)', ''],
  ['芙莉歐莎：疯狂的麦克斯传奇篇章', 'Furiosa: A Mad Max Saga (2024)', ''],
  ['侏罗纪世界3：统治', 'Jurassic World Dominion (2022)', ''],
  ['变形金刚', 'Transformers (2007)', ''],
  ['变形金刚3：月黑之时', 'Transformers: Dark of the Moon (2011)', ''],
  ['变形金刚5：最后的骑士', 'Transformers: The Last Knight (2017)', ''],
  ['大黄蜂', 'Bumblebee (2018)', ''],
  ['异形', 'Alien (1979)', ''],
  ['异形2', 'Aliens (1986)', ''],
  ['异形3', 'Alien 3 (1992)', ''],
  ['异形4：复活', 'Alien: Resurrection (1997)', ''],
  ['异形大战铁血战士', 'Alien vs. Predator (2004)', ''],
  ['异形大战铁血战士2：安魂曲', 'Aliens vs. Predator: Requiem (2007)', ''],
  ['终结者3：机器之战', 'Terminator 3: Rise of the Machines (2003)', ''],
  ['007：无暇赴死', 'No Time to Die (2021)', ''],
  ['哈利波特1：神秘的魔法石', "Harry Potter and the Philosopher's Stone (2001)", ''],
  ['哈利波特2：消失的密室', 'Harry Potter and the Chamber of Secrets (2002)', ''],
  ['哈利波特3：阿兹卡班的囚徒', 'Harry Potter and the Prisoner of Azkaban (2004)', ''],
  ['哈利波特4：火焰杯', 'Harry Potter and the Goblet of Fire (2005)', ''],
  ['哈利波特5：凤凰会的密令', 'Harry Potter and the Order of the Phoenix (2007)', ''],
  ['哈利波特6：混血王子的背叛', 'Harry Potter and the Half-Blood Prince (2009)', ''],
  ['怪兽与它们的产地', 'Fantastic Beasts and Where to Find Them (2016)', ''],
  ['怪兽与葛林戴华德的罪行', 'Fantastic Beasts: The Crimes of Grindelwald (2018)', ''],
  ['怪兽与邓不利多的秘密', 'Fantastic Beasts: The Secrets of Dumbledore (2022)', ''],
  ['权力的游戏 第一季', 'Game of Thrones Season 1 (2011)', ''],
  ['霍比特人3：五军之战', 'The Hobbit: The Battle of the Five Armies (2014)', ''],
  ['毒液2：屠杀登场', 'Venom: Let There Be Carnage (2021)', ''],
  ['死侍', 'Deadpool (2016)', ''],
  ['死侍与金刚狼', 'Deadpool & Wolverine (2024)', ''],
  ['黑豹2：瓦干达万岁', 'Black Panther: Wakanda Forever (2022)', ''],
  ['X战警：金钢狼', 'X-Men Origins: Wolverine (2009)', ''],
  ['金钢狼：武士之战', 'The Wolverine (2013)', ''],
  ['罗根', 'Logan (2017)', ''],
  ['星球大战8：最后的绝地武士', 'Star Wars: The Last Jedi (2017)', ''],
  ['星球大战外传：侠盗一号', 'Rogue One: A Star Wars Story (2016)', ''],
  ['星球大战外传：韩索罗', 'Solo: A Star Wars Story (2018)', ''],
];

function cleanEn(en) {
  let s = en.replace(/\?/g, ' ');              // 編碼產生的 ? 多半是空格
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/(\S)\((\d{4})\)/g, '$1 ($2)'); // 年份前補空格
  return s;
}

const out = [];
const log = { removed: [], completed: [], fixed: [], cleaned: 0, kept: 0 };

for (const line of lines) {
  if (line.startsWith('中文名')) { out.push(line); continue; }
  const parts = line.split(',');
  let cn = (parts[0] || '').trim();
  let en = (parts[1] || '').trim();
  let cap = (parts[2] || '').trim();

  if (remove.has(cn)) { log.removed.push(cn); continue; }

  if (cnFix.has(cn)) {
    const f = cnFix.get(cn);
    en = f.en;
    if (f.cap !== undefined) cap = f.cap;
    log.fixed.push(cn + ' -> ' + en);
  } else if (en === '') {
    if (complete.has(cn)) { en = complete.get(cn); log.completed.push(cn + ' -> ' + en); }
  } else {
    const c = cleanEn(en);
    if (c !== en) { en = c; log.cleaned++; }
  }
  out.push([cn, en, cap].join(','));
  log.kept++;
}

for (const [cn, en, cap] of additions) out.push([cn, en, cap].join(','));

writeFileSync('source.csv', out.join('\n') + '\n', 'utf8');

// 簡易查重（正規化英文名）
const seen = new Map();
let dups = 0;
for (let i = 1; i < out.length; i++) {
  const en = (out[i].split(',')[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!en) continue;
  if (seen.has(en)) { dups++; console.log('DUP:', seen.get(en), '==', out[i].split(',')[0]); }
  else seen.set(en, out[i].split(',')[0]);
}
let bare = 0;
for (let i = 1; i < out.length; i++) if (!(out[i].split(',')[1] || '').trim()) { bare++; console.log('BARE:', out[i].split(',')[0]); }

console.log('--- summary ---');
console.log('kept(excl header):', log.kept, '| removed:', log.removed.length, '| completed:', log.completed.length, '| fixed:', log.fixed.length, '| cleaned:', log.cleaned);
console.log('added:', additions.length, '| total rows(excl header):', out.length - 1);
console.log('remaining dups:', dups, '| remaining bare:', bare);
