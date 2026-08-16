# bdmv · 夸克網盤資源搜尋專案

## 專案簡介
本工作區對 `source.csv` 中的電影清單，批次搜尋**夸克網盤（pan.quark.cn）**資源，
並以兩種方式呈現結果：

- **批次腳本**：`panhub.shenzjd.com/scripts/batch-quark-search.mjs`（v1.1.6），離線產出 CSV/JSON 報表。
- **一鍵儀表板**：`panhub.shenzjd.com/scripts/run-quark-dashboard.mjs`（v1.0.6）+ `dashboard.html`，
  「啟動即自動搜尋、自動開瀏覽器顯示 web 介面、SSE 即時推送進度與結果」。
  這正是「寫死流程、每次啟動自動基於 source.csv 搜尋並以 web 介面呈現」的實作。

> 說明：因搜尋結果不回傳檔案大小（`Link` 只有 type/url/password），「影片容量」**不做過濾**，僅作輸出中的參考欄位。

- `source.csv`：來源清單，三欄 `中文名,英文名,影片容量`（容量如 `58.1G`，補全列可留空 N/A）。
- `panhub.shenzjd.com/`：clone 自 https://github.com/wu529778790/panhub.shenzjd.com 的 Nuxt 網盤搜尋站，
  其後端自帶搜尋服務（插件 `quark4k` + TG 頻道），`/api/search` 即搜尋入口。
- `panhub.shenzjd.com/scripts/batch-quark-search.mjs`：批次搜尋腳本（獨立執行，不動網站本體）。
- `panhub.shenzjd.com/scripts/run-quark-dashboard.mjs` + `dashboard.html`：一鍵儀表板（自動搜尋 + web 介面）。
- `enrich-source.mjs`：補全 `source.csv` 的資料腳本（清理英文名、修正錯誤、補中文-only 列、去重、補系列缺口），可重跑。
- `sort-source.mjs`：將 `source.csv` 依系列群聚排序、並可補齊指定系列（如復仇者聯盟）的資料腳本，可重跑。

## 儀表板（run-quark-dashboard.mjs v1.0.4 + dashboard.html）
**寫死流程、開箱即用**：只要 `node scripts/run-quark-dashboard.mjs`，程式就會：
1. 讀 `source.csv`（自動跳過表頭，含 BOM 容錯）。
2. 對每筆的「英文名 + **全部中文譯名**（`/` 分隔的各版本，如 `阿凡达：水之道/阿凡达2/阿凡达2：水之道` 拆成 3 個中文詞）」**分別**搜尋 `quark4k` 插件（`GET /api/search?res=results&src=plugin&plugins=quark4k`）；同一條連結若被多個譯名命中，以 URL 去重只計一次。
3. 只保留 `type==='quark'` 的連結、依時間新→舊排序。
4. 啟動本地 HTTP（預設 8080），透過 **SSE** 即時把 `reset/progress/snapshot/done` 推播到瀏覽器。
5. **自動開啟瀏覽器**顯示儀表板：每部片一張卡片（中文名、英文名、影片容量、命中數、夸克連結含網址/提取碼/標題/時間），
   支援「只顯示有命中」「片名篩選」「一鍵複製網址/提取碼」「重新搜尋」按鈕（POST `/api/rerun`）。

**後端自啟**：若 `node_modules` 已存在且 `AUTOSTART_BACKEND!=0`，程式會自動 `npm run dev` 拉起 panhub 後端；
若後端連不上，結果為空但程式不崩潰（僅告警）。

環境變數：`PANHUB_BASE_URL`(預設 `http://localhost:4000`)、`SOURCE_CSV`、`DASHBOARD_PORT`(8080)、
`ROW_CONCURRENCY`(3)、`PLUGIN_TIMEOUT_MS`(15000)、`AUTOSTART_BACKEND`(1)。

## 資料集 source.csv（v2 補全，2026-08-16）
原 `source.csv`（v1，130 筆）經網路查證與補全，現為 **164 筆**：
- **去重（移除 10 筆）**：`星球大战1~6` 裸列（與下方 EP1~6/4~6 正片重複）、`碟中谍3` 裸列（與正片 MI3 重複）、`碟中谍7(下)` 裸列（已併入 MI8）、`侏罗纪世界：重生 3G`（與 92.8G 正片重複）、`变形金刚：超能勇士崛起 13.5G`（與 87.5G 正片重複）。
- **補中文-only 列英文名（6 筆）**：`星际迷航3`、`碟中谍1/2/4/5/6` 補上英文片名，影片容量留空。
- **修正錯誤**：`速度与激情2` 原誤標為 Tokyo Drift → 改為 `2 Fast 2 Furious (2003)`；`海王2` 英文名補全為 `Aquaman and the Lost Kingdom`；`星球大战` 前傳1/2、EP4、`权力的游戏 第二季`、`哈利波特7(下)` 等英文名規格化。
- **清理編碼雜訊（42 筆）**：英文名中的 `?` 佔位符還原為空格、年份前補空格。
- **補系列缺口（新增 44 筆，容量留空 N/A，含外傳/旁支/重啟）**：玩命關頭4/9/10+Hobbs&Shaw、星際迷航重啟三部曲、瘋狂麥克斯1/Fury Road/Furiosa、侏羅紀王朝、變形金剛1/3/5/大黃蜂、異形1~4+AVP×2、終結者3、007無暇赴死、哈利波特1~6+怪獸3部曲、權力遊戲S1、哈比人3、毒液2、死侍+金鋼狼、黑豹2、X戰警金鋼狼三部曲、星際大戰8+俠盜一号+韓索羅。
- **備份**：原始 v1 備份於 `source.csv.bak`。
- **未補範圍**：007 僅補完「丹尼爾·克雷格時代」5 部（含本作），經典時代 23 部未納入，如需可再補。

## 資料集 source.csv（v3 排序 + 補復仇者聯盟，2026-08-16）
現為 **168 筆**（較 v2 補 4 筆復仇者聯盟，容量留空 N/A），並全檔重排：
- **補復仇者聯盟 4 部**：`复仇者联盟 (2012)` / `复仇者联盟2：奥创纪元 (2015)` / `复仇者联盟3：无限战争 (2018)` / `复仇者联盟4：终局之战 (2019)`。
- **系列群聚排序**：採用「子系列各自成組」——同一子系列歸一組、組內依上映年升冪、組間依該系列最早上映年升冪；單片（自成 1 組）統一墊底、依中文片名排序。結果 168 筆分 46 組（31 個多片組 + 15 個單片）。
- **歸類細節**：`大黄蜂` 併入變形金剛；`罗根` / `金钢狼：武士之战` 併入 X戰警（金鋼狼三部曲）；異形含普羅米修斯 / Covenant / AVP。
- **可重跑**：`sort-source.mjs` 會判斷復仇者聯盟是否已存在（已存在則不重複新增），重跑順序穩定。
- **備份**：重排前備份 `source.csv.pre-sort.bak`。
- **v4 補飢餓遊戲（2026-08-16）**：新增核心 4 部（2012 / 2013 / 2014上 / 2015下），2023 前傳本就在檔案中；現 172 筆、46 組。待補系列邏輯改為通用 `ADDITIONS` 陣列（復仇者聯盟 + 飢餓遊戲），未來要加系列只要往陣列塞資料、重跑即冪等。
- **v5 補「動作冒險經典」叢集（2026-08-16）**：新增 47 部——印第安納瓊斯(5)、加勒比海盜(5)、人猿星球重啟三部曲+Kingdom(4)、哥吉拉/MonsterVerse(5)、藍波(5)、終極警探(5)、神鬼認證(5)、洛基/Rocky+Creed(9)、終極戰士×4（併入異形組）。現 **219 筆、54 組（40 多片組 + 14 單片）**。
- **v6 補生化危機3/4 + 雷神1（2026-08-16）**：直接補入所屬系列群組（依上映年排序）、容量留空 N/A：
  - 生化危機3（Resident Evil: Extinction, 2007）、生化危機4（Resident Evil: Afterlife, 2010）—— 生化危機1~6 核心系列現已齊全（2021 重啟《惡靈古堡：歡迎來到雷孔市》未納入，視需求再補）。
  - 雷神1（Thor, 2011）—— 雷神1~3 齊全（雷神4《愛與雷霆》2022 未納入，視需求再補）。
  - 現 **209 筆**（系列群聚排序不變，新增 3 筆落入既有 RE / Thor 組；readme 舊值 222 已過時，依現檔案更正）。另：搜尋新增 4K 解析度過濾（見「腳本行為 v1.1.2」第 3 點）。
- **尚待續補的著名 4K 系列（建議）**：DC / 漫改英雄（蝙蝠俠諾蘭三部曲、超人、正義聯盟、自殺突擊隊、美國隊長含英雄內戰）、蜘蛛人全系列（Raimi+驚奇再起+MCU，共 8 部）、其他動作/小品（浴血任務、金牌特務、會計刺刺客、絕地戰警、神鬼傳奇、阿凡達3）、生化危機2021重啟、雷神4 等，詳見對話建議。

## 腳本行為（v1.1.6）
1. 讀 `source.csv`，逐筆產生搜尋關鍵字：**英文名 + 全部中文譯名**。中文欄以 `/` 分隔的多版本譯名（如 `阿凡达：水之道/阿凡达2/阿凡达2：水之道`）會拆成多個中文詞、各自分開搜尋，並去除括號規格；關鍵字以 Set 去重，避免重複搜尋同一譯名。同電影因不同譯名命中同一條連結時，以 URL 去重只計一次。
   - **v1.1.5 起進一步放寬搜尋字串**：每個中文譯名除完整名外，再拆出「冒號前的系列+集數」與「冒號後的副標題」分開搜尋（如 `星球大战2：帝国反击战` → 另搜 `星球大战2` / `帝国反击战`）；英文名除完整片名外，再補「冒號後副標題」與「片名+年份」（如 `Star Wars: The Empire Strikes Back (1980)` → 另搜 `The Empire Strikes Back` / `Star Wars The Empire Strikes Back 1980`）。避免過長/帶冒號的完整標題在網盤搜尋幾乎命中不了的問題。
2. 對每個關鍵字呼叫 `GET /api/search?res=results&src=all`（**預設搜全部來源**＝8 個插件 pansearch/melost/quark4k/ouge/wanou/yunso/u3c3/dyyjv ＋ TG 頻道，與官網 `?q=` 預設一致）；可透過 `SEARCH_SRC`（all/plugin/tg）與 `PLUGINS`（留空=全部插件；如 `quark4k` 回到原本只搜 quark4k 的輕量模式）限定。結果仍只保留 `type==="quark"` 連結（見第 3 點），故**輸出仍只有夸克連結、命中率卻與官網對齊**。
   - **v1.1.6 修正「官網有、腳本 0 筆」**：舊版寫死 `src=plugin&plugins=quark4k` 只搜單一 quark4k 插件；quark4k 對部分關鍵詞會回 0（repo docs 亦載明「單關鍵詞不可靠」），而官網搜全部來源故有結果。改為預設 `src=all` 後，星球大战7 等原本 0 筆的片也能從其他插件/TG 取得夸克連結。
3. 結果只保留 `type === "quark"`（pan.quark.cn）的連結，且**預設只保留 4K 資源**：貼文標題或內文須含 `4k` / `2160p`（大小寫不敏感，正則 `/\b(4k|2160p)\b/i`）；由環境變數 `ONLY_4K=0` 關閉（關閉後退回「只留夸克連結」）。
4. **「影片容量」不做過濾**：搜尋結果不回傳檔案大小（`Link` 只有 type/url/password），權威大小需對每條連結
   單獨呼叫夸克詳情 API 才取得，成本過高、不適合作為過濾條件。故 `影片容量` 僅作輸出中的【參考欄位】；
   若貼文內文恰好含大小文字，會附註為「解析大小(參考)」供人工比對，絕不參與篩選。
5. 輸出 `quark-search-results.csv`（每個命中連結一列）與 `quark-search-results.json`（含每片統計）。
6. **擬人搜尋節流（防反爬/限流）**：每次請求前先「全域節流」——間隔 `SEARCH_DELAY_MS`（預設 1500ms，含 ±40% 隨機抖動），讓請求一筆一筆、像人在搜；並附**常見瀏覽器 User-Agent**、遇 HTTP 429/503 或網路錯誤**退避重試** `SEARCH_RETRIES`（預設 3）次。兩腳本共用。
   - 批次腳本另提供 `node batch-quark-search.mjs --probe-first`：只用**第 1 筆資料**搜尋並印出「原始命中數 / 4K 通過數 / 範例標題」，用來區分到底是「4K 過濾吃掉」還是「後端/反爬問題」。
   - 另提供 `node batch-quark-search.mjs --probe-keyword "阿凡达"`（或 `--probe-keyword=阿凡达`）：直接以**任意指定關鍵字**做診斷，不需改 CSV，方便拿「確定有 4K」的片（如 `阿凡达` / `Avatar` / `復仇者聯盟4`）來驗證 4K 過濾是否真的有命中。

## 如何執行
```bash
# 1) 安裝並啟動搜尋後端（需先 npm install，且在能連到 quark4k.com 的環境）
cd panhub.shenzjd.com
npm install
npm run dev            # 預設 http://localhost:4000 （未設 SEARCH_PASSWORD 時免驗證）

# 2a) 批次報表（離線 CSV/JSON）
node panhub.shenzjd.com/scripts/batch-quark-search.mjs
#    或： npm --prefix panhub.shenzjd.com run batch:quark

# 2b) 一鍵儀表板（自動搜尋 + 自動開瀏覽器顯示 web 介面）
node panhub.shenzjd.com/scripts/run-quark-dashboard.mjs
#    → 自動開啟 http://localhost:8080 ；若後端已 npm install 且未設 AUTOSTART_BACKEND=0，
#      程式會自己 npm run dev 拉起後端
```
批次腳本常用參數：`PANHUB_BASE_URL`、`SOURCE_CSV`、`OUTPUT_DIR`、`ROW_CONCURRENCY`、`PLUGIN_TIMEOUT_MS`、`ONLY_4K`(1)、`SEARCH_DELAY_MS`(1500)、`SEARCH_RETRIES`(3)、`SEARCH_SRC`(all)、`PLUGINS`(全部插件)。除錯：`--self-test` / `--parse-only` / `--probe-first`（只用第 1 筆資料搜尋並印出診斷，不需完整跑全量）/ `--probe-keyword "<片名>"`（以任意指定關鍵字做診斷，不需改 CSV）。
儀表板常用參數：`PANHUB_BASE_URL`、`SOURCE_CSV`、`DASHBOARD_PORT`(8080)、`ROW_CONCURRENCY`(3)、`PLUGIN_TIMEOUT_MS`(15000)、`AUTOSTART_BACKEND`(1)、`ONLY_4K`(1)、`SEARCH_DELAY_MS`(1500)、`SEARCH_RETRIES`(3)、`SEARCH_SRC`(all)、`PLUGINS`(全部插件)。
批次腳本除錯：`node panhub.shenzjd.com/scripts/batch-quark-search.mjs --self-test` / `--parse-only`（不需伺服器）。

## 克隆與初始化 submodule
本倉庫的搜尋站 `panhub.shenzjd.com/` 是以 **git submodule** 形式引入（指向 fork `cyrilliu1974/panhub.shenzjd.com`，已含本專案的批次腳本與儀表板修改）。克隆後需初始化 submodule 才能執行：
```bash
git clone --recurse-submodules https://github.com/cyrilliu1974/panhub.git
# 或已克隆後再補：
git submodule update --init --recursive
cd panhub.shenzjd.com && npm install
```
submodule 自己的 `.gitignore` 已排除 `node_modules/`、`.nuxt/`、`.output/`、`.data/`、`.nitro/`、`.cache/`、`dist/` 等建置產物，根目錄 `.gitignore` 亦對其保留兜底規則。

## 發佈 dashboard 修改（submodule 流程）
`panhub.shenzjd.com/` 是 submodule，故「修改 `scripts/dashboard.html` 後要讓別人下載到新版」**不能只推根倉庫**——必須先推 submodule，再回根倉庫更新指針。否則別人 clone 仍拿到舊版。

**一鍵方式**（推薦）：在倉庫根目錄雙擊 `publish-dashboard.bat` 即可自動完成「submodule 提交+推送 → 根倉庫更新指針+推送」。可帶自訂提交訊息：
```bat
publish-dashboard.bat 修正複製按鈕邏輯
```

**手動方式**（順序不能反）：
```bash
cd panhub.shenzjd.com
git add scripts/dashboard.html
git commit -m "fix: dashboard 調整 XXX"
git push origin main          # 先推 submodule（否則別人拉不到）

cd ..
git add panhub.shenzjd.com
git commit -m "chore: 更新 submodule 至 dashboard 新版本"
git push origin main          # 再推根倉庫（更新指針）
```

**防呆檢查**（推之前確認無遺漏）：兩個命令都無輸出才代表別人能拿到全部改動。
```bash
git -C panhub.shenzjd.com log origin/main..HEAD --oneline   # submodule 已推？
git log origin/main..HEAD --oneline                          # 根倉庫已推？
```
> 注意：根目錄的 `夸克網盤資源搜尋儀表板.html`（1.2MB）是瀏覽器存的「結果快照」，非源碼，已被根目錄 `.gitignore` 排除，不在發佈範圍內。要分享的是 submodule 內的 `scripts/dashboard.html` 源碼。

## 重要限制
- 真實搜尋依賴 `quark4k` 插件能連到 quark4k.com，且需先 `npm run dev` 起好後端；沙箱環境無法實跑。
- 搜尋結果不含檔案大小欄位，「解析大小(參考)」是從內文猜測，可能缺失或不準，請勿用於自動判斷。

## Changelog
- **batch-quark-search.mjs v1.1.6 + run-quark-dashboard.mjs v1.0.6：搜尋來源改為全部（修「官網有、腳本 0 筆」）** (2026-08-16)
  - 回應「官網 panhub.shenzjd.com/?q=星球大战7 找得到 9 筆、腳本卻 0 筆」：根因非關鍵字放寬（v1.1.5 已做），而是舊版寫死 `src=plugin&plugins=quark4k` 只搜單一 quark4k 插件；quark4k 對部分關鍵詞會回 0（repo docs 載明「單關鍵詞不可靠」），而官網 `?q=` 預設 `src=all` 搜全部來源故有結果。
  - 兩腳本 `searchOnce` 改為預設 `src=all`（與官網一致，搜 8 個插件 + TG），並新增 `SEARCH_SRC`(all/plugin/tg) 與 `PLUGINS`(留空=全部插件) 環境變數；`res=results` 解析不變（後端對 `res=results` 回 `{total,results}`）。結果仍只保留 `type==="quark"` 連結，輸出性質不變（仍只有夸克連結），但命中率與官網對齊。
  - `PLUGINS=quark4k SEARCH_SRC=plugin` 可還原舊的輕量只搜 quark4k 行為。
  - 備份舊版 `scripts/batch-quark-search.mjs.v1.1.5.bak` / `scripts/run-quark-dashboard.mjs.v1.0.5.bak`；`node --check` 兩腳本 OK、`--self-test` ALL PASS；啟動橫幅新增「搜尋來源」顯示。
- **batch-quark-search.mjs v1.1.5 + run-quark-dashboard.mjs v1.0.5：放寬搜尋關鍵字（拆系列+集數 / 副標題 / 年份）** (2026-08-16)
  - 回應「搜尋字串太侷限」：原 `cnAliasList` 直接用完整譯名（如 `星球大战2：帝国反击战`）搜尋，帶冒號的長標題在網盤搜尋幾乎命中不了，導致大量 0 結果（星球大战2/3/前傳等全 0，僅靠 EN 偶爾補到）。
  - 兩腳本 `cnAliasList` 重構：每個中文譯名除完整名外，再拆出「冒號前的系列+集數」(星球大战2) 與「冒號後的副標題」(帝国反击战)，各自分開搜尋、URL 去重；並新增 `enSearchKeywords`：英文再補「冒號後副標題」(The Empire Strikes Back) 與「片名+年份」(Star Wars The Empire Strikes Back 1980)。
  - 驗證 `--parse-only`：星球大战2 列現搜尋詞 = [Star Wars: Episode V - The Empire Strikes Back | 星球大战2：帝国反击战 | 星球大战2 | 帝国反击战 | 星球大战5：帝国反击战 | 星球大战5]，確認放寬生效。
  - 備份舊版 `scripts/batch-quark-search.mjs.v1.1.4.bak` / `scripts/run-quark-dashboard.mjs.v1.0.4.bak`；`node --check` 兩腳本 OK、`--self-test` ALL PASS。
  - 附帶更正：source.csv 現實際 209 筆（readme 舊值 222 已過時）；經查無列被靜默略過，解析正常。
- **batch-quark-search.mjs v1.1.4：新增 `--probe-keyword` 指定關鍵字診斷** (2026-08-16)
  - 回應「用一個確定有 4K 的片來測試」：`--probe-first` 固定只測第 1 筆（洛基/Rocky），無法指定片名；新增 `--probe-keyword "阿凡达"`（或 `--probe-keyword=阿凡达`），直接以任意關鍵字做診斷、不需改 CSV。
  - `probeFirst(overrideKeyword)` 重構：有指定關鍵字時只搜該詞，否則維持原本「讀第 1 筆 → 拆中/英關鍵字」；`main()` 優先解析 `--probe-keyword`（缺值時報錯退出）。
  - 推薦測試關鍵字（幾乎必有 4K 原盤）：`阿凡达`/`Avatar`、`復仇者聯盟4`、`鋼鐵人`、`星際大戰`。
  - 備份舊版 `scripts/batch-quark-search.mjs.v1.1.3.bak`；`node --check` OK、`--self-test` ALL PASS、`--probe-keyword "阿凡达"` 冒煙測試正常輸出診斷（沙箱無後端 → fetch failed 屬預期）。
- **batch-quark-search.mjs v1.1.3 + run-quark-dashboard.mjs v1.0.4：擬人節流 + 瀏覽器 UA + 重試 + 診斷模式** (2026-08-16)
  - 回應「搜尋結果均為 0」：原程式無瀏覽器 UA、請求連發無間隔，極易被反爬/限流擋下；且上一版新開的 4K 過濾（`ONLY_4K=1` 預設）若貼文未含 `4k`/`2160p` 字面，會把所有結果濾成 0。
  - 兩腳本 `searchOnce` 改為：附**常見瀏覽器 UA**、**全域節流**（每筆間隔 `SEARCH_DELAY_MS` 預設 1500ms ±40% 抖動，請求一筆一筆）、遇 429/503/網路錯誤**退避重試** `SEARCH_RETRIES`（預設 3）。
  - 新增 `batch-quark-search.mjs --probe-first`：只用第 1 筆資料搜尋並印出「原始命中數 / 4K 通過數 / 範例標題」，協助區分「4K 過濾吃掉」與「後端/反爬問題」；第一筆 `洛基 / Rocky (1976)` 的關鍵字已確認為 `[Rocky | 洛基]`、請求構造無誤。
  - 建議先以 `ONLY_4K=0` 跑一次確認是否有原始結果；若原始命中仍為 0，再加/調 `SEARCH_DELAY_MS`（或檢查 quark4k.com 是否可連）。
  - 備份舊版 `.v1.1.2.bak` / `.v1.0.3.bak`；`node --check` 兩腳本 OK、`--self-test` ALL PASS、`--probe-first` 可正常輸出診斷。
- **batch-quark-search.mjs v1.1.2 + run-quark-dashboard.mjs v1.0.3：搜尋只保留 4K/2160p + 補生化危機3/4、雷神1** (2026-08-16)
  - 搜尋條件新增「解析度過濾」：預設只接受標題或內文含 `4k` / `2160p` 的貼文（即 4K 資源），以 `ONLY_4K=0` 關閉、退回「只留夸克連結」。
  - 回應需求「搜尋條件上只搜尋 4k 或 2160p」：兩腳本新增共用輔助函式 `is4kPost()`（正則 `/\b(4k|2160p)\b/i`），在結果迴圈 `for (const r of results)` 內先判斷、非 4K 直接 `continue`；並於環境變數文件補 `ONLY_4K`。
  - `source.csv` 補齊缺失：生化危機3（Extinction 2007）、生化危機4（Afterlife 2010）、雷神1（Thor 2011），直接落入既有 RE / Thor 系列群組、依上映年排序；容量留空 N/A。現 222 筆。
  - 備份舊版 `scripts/batch-quark-search.mjs.v1.1.1.bak`、`scripts/run-quark-dashboard.mjs.v1.0.2.bak`；`node --check` 兩腳本 OK、`--self-test` ALL PASS、`--parse-only` 讀 222 筆無略過。
- **batch-quark-search.mjs v1.1.1 + run-quark-dashboard.mjs v1.0.2：中文譯名多版本分開搜尋 + URL 去重** (2026-08-16)
  - 回應需求「中文譯名或有不同版本，搜尋時也要分別搜尋不同版本翻譯名，但要檢查是否重複」。
  - 兩腳本將 `cnMainName` 改為 `cnAliasList`：以 `/` 拆出全部中文譯名（如 `阿凡达：水之道/阿凡达2/阿凡达2：水之道` 拆成 3 個），去除括號規格與空白，各自分開搜尋。
  - 關鍵字以 `Set` 去重（同片多譯名不會重複送出搜尋）；命中連結以 URL（`seen` 集合）去重，同一條連結被多個譯名命中只計一次。
  - 修復 batch 解析器 `parseCsvLine`：原 `([^,]+)` 要求容量欄非空白，導致補全列（容量留空 N/A 的復仇者/飢餓遊戲/動作叢集約 50 筆）被靜默略過；放寬為 `(.*)` 容許空白容量，現 219 筆全數讀入。
  - 備份舊版 `scripts/batch-quark-search.mjs.v1.1.0.bak`、`scripts/run-quark-dashboard.mjs.v1.0.1.bak`；`--self-test` 全 PASS、`--parse-only` 無略過告警。
- **source.csv v5 補「動作冒險經典」叢集** (2026-08-16)
  - `sort-source.mjs` 的 `ADDITIONS` 陣列再加 47 部：印第安納瓊斯、加勒比海盜、人猿星球、哥吉拉/MonsterVerse、藍波、終極警探、神鬼認證、洛基/Rocky+Creed、終極戰士（併入異形組）。
  - `SERIES` 比對表新增對應系列 matcher；現 219 筆、54 組。腳本仍冪等。
- **source.csv v4 補飢餓遊戲** (2026-08-16)
  - `sort-source.mjs` 待補邏輯改為通用 `ADDITIONS` 陣列（復仇者聯盟 + 飢餓遊戲）；新增飢餓遊戲核心 4 部（2023 前傳本就在）。
  - 現 172 筆、46 組；Hunger Games 群聚為 5 部（2012→2023）。腳本保持冪等。
- **source.csv v3 排序 + 補復仇者聯盟** (2026-08-16)
  - 新增 `sort-source.mjs`（可重跑）：先補齊「復仇者聯盟」4 部核心電影（容量留空 N/A），再全檔重排為「同子系列群聚、組內/組間依上映年、單片墊底依片名」。
  - 現 168 筆、46 組（31 多片組 + 15 單片）；`大黄蜂`→變形金剛、`罗根`/`金钢狼：武士之战`→X戰警 已併入所屬系列。
  - 備份 `source.csv.pre-sort.bak`；腳本具冪等性（復仇者聯盟已存在則跳過新增）。
- **run-quark-dashboard.mjs v1.0.1 + dashboard.html** (2026-08-16)
  - 實作「寫死流程、啟動即自動搜尋 source.csv 並以 web 介面呈現」：自帶 Node HTTP + SSE 即時推送、自動開瀏覽器、後端自啟。
  - 前端 `dashboard.html`：每片一張卡片（中/英文名、影片容量、命中數、夸克連結含網址/提取碼/標題/時間），支援「只顯示有命中」「片名篩選」「一鍵複製」「重新搜尋」。
  - 修復：讀 CSV 時去除 UTF-8 BOM，避免表頭被誤判為資料列（Excel/Windows 存檔常見）。
  - 已通過無後端環境的 headless 冒煙測試：HTML 正常服務、`/stream` 正確派發 hello/snapshot、`/api/rerun` 回 202、表頭正確跳過。
- **source.csv v2 補全** (2026-08-16)
  - 網路查證各系列電影年表，補全 `source.csv`：去重 10 筆、補中文-only 列英文名 6 筆、修正 `速度与激情2`/`海王2` 等英文名錯誤、清理 42 筆 `?` 編碼雜訊、新增 44 筆系列缺口（含外傳/旁支/重啟，容量留空 N/A）。
  - 來源 v1 備份至 `source.csv.bak`；補全邏輯收錄於 `enrich-source.mjs`（可重跑）。
  - 007 經典時代 23 部暫未納入（僅補克雷格時代），後續可視需求擴充。
- **v1.1.0** (2026-08-16)
  - 確認搜尋結果不含檔案大小欄位（Link 只有 type/url/password，權威大小需對每條連結單獨呼叫夸克詳情 API）。
  - 移除「影片容量」作為過濾條件：現僅「只留夸克連結」，影片容量改為輸出中的【參考欄位】，解析大小僅供人工比對。
  - 原 v1.0.0 腳本備份至 `scripts/batch-quark-search.mjs.v1.0.0.bak`。
- **v1.0.0** (2026-08-16)
  - 新增 `scripts/batch-quark-search.mjs`：讀 source.csv、中英各搜一次 quark4k、只留夸克連結且大小超過影片容量者。
  - 加入 `package.json` script：`batch:quark` / `batch:quark:selftest`。
  - 自帶 `--self-test`（大小解析/鄰近連結/過濾邏輯全數 PASS）與 `--parse-only` 模式。
  - 對齊確認：獨立腳本 / 只開 quark4k+只留夸克連結 / 中英各搜一次合併 / 呼叫本地 /api/search。
