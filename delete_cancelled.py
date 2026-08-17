#!/usr/bin/env python3
# delete_cancelled.py - 依 cancelled url 清單，從 quark-search-results.json 移除對應 match
# 用法:
#   python delete_cancelled.py <cancelled_file> [--dry-run] [--apply]
#   --dry-run (預設): 只預覽要刪除的項目，不寫檔
#   --apply        : 真正寫回 quark-search-results.json（備份請自行保留）
import json, sys, os

JSON_PATH = r"C:\AI\panhub\quark-search-results.json"

def main():
    args = sys.argv[1:]
    cancelled_file = None
    apply = False
    for a in args:
        if a == "--apply":
            apply = True
        elif a == "--dry-run":
            apply = False
        elif cancelled_file is None:
            cancelled_file = a
    if not cancelled_file or not os.path.exists(cancelled_file):
        print("ERROR: cancelled_file not found:", cancelled_file); sys.exit(1)

    with open(cancelled_file, encoding="utf-8") as f:
        cancelled = set(line.strip() for line in f if line.strip())

    d = json.load(open(JSON_PATH, encoding="utf-8"))
    movies = d["movies"]

    removed_total = 0
    removed_per_movie = []
    for mv in movies:
        before = len(mv.get("matches", []))
        new_matches = [mt for mt in mv.get("matches", []) if mt.get("url") not in cancelled]
        after = len(new_matches)
        if before != after:
            removed = before - after
            removed_total += removed
            mv["matches"] = new_matches
            mv["matchCount"] = after
            removed_per_movie.append((mv.get("cn",""), before, after, removed))

    # 更新 summary
    s = d.get("summary", {})
    s["totalMatchedLinks"] = s.get("totalMatchedLinks", 0) - removed_total
    s["totalUnverified"] = s.get("totalUnverified", 0) - removed_total
    s["moviesWithMatches"] = sum(1 for mv in movies if len(mv.get("matches", [])) > 0)
    d["summary"] = s

    print(f"cancelled urls in set: {len(cancelled)}")
    print(f"total match entries removed: {removed_total}")
    print(f"movies affected: {len(removed_per_movie)}")
    for cn, b, a, r in removed_per_movie[:40]:
        print(f"  - {cn}: {b} -> {a} (removed {r})")
    if len(removed_per_movie) > 40:
        print(f"  ... and {len(removed_per_movie)-40} more")

    if apply:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
        print(f"=== APPLIED. wrote {JSON_PATH} ===")
    else:
        print("=== DRY-RUN (no file written). Use --apply to write. ===")

if __name__ == "__main__":
    main()
