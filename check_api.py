#!/usr/bin/env python3
# check_api.py - 用 Quark 分享狀態 API 判定每個分享是否「已取消」(code 41012)
# 對應瀏覽器中「该分享已被取消，无法访问」的狀態。比開瀏覽器快且穩定。
# 用法: python check_api.py <json_path> <cancelled_out_file>
import json, sys, time, urllib.request, urllib.error

API = "https://drive-pc.quark.cn/1/clouddrive/share/sharepage/token"
CANCELED_CODE = 41012

def check_pwd(pwd_id, retries=3):
    body = json.dumps({"pwd_id": pwd_id, "passcode": ""}).encode("utf-8")
    req = urllib.request.Request(API, data=body, headers={
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
    }, method="POST")
    last = None
    for _ in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8", "replace"))
            return data.get("code")
        except urllib.error.HTTPError as e:
            try:
                data = json.loads(e.read().decode("utf-8", "replace"))
                return data.get("code")
            except Exception:
                last = e
        except Exception as e:
            last = e
            time.sleep(1.0)
    return None

def main():
    json_path = sys.argv[1]
    out_file = sys.argv[2]
    d = json.load(open(json_path, encoding="utf-8"))
    # 收集唯一 pwd_id -> 對應的原始 url（保留一筆代表 url 即可，刪除時按 url 比對）
    seen = {}
    for mv in d["movies"]:
        for mt in mv.get("matches", []):
            u = mt.get("url", "")
            if not u:
                continue
            pid = u.rstrip("/").split("/")[-1]
            if pid not in seen:
                seen[pid] = u
    print(f"unique shares to check: {len(seen)}", flush=True)

    cancelled = []
    done = 0
    with open(out_file, "w", encoding="utf-8") as out:
        for pid, u in seen.items():
            code = check_pwd(pid)
            done += 1
            if code == CANCELED_CODE:
                cancelled.append(u)
                out.write(u + "\n"); out.flush()
                print(f"[{done}/{len(seen)}] CANCELED -> {u}", flush=True)
            elif code is None:
                print(f"[{done}/{len(seen)}] ERROR(no response) -> {u}", flush=True)
            else:
                # 其他狀態（ok=0, expired=41019, auditing=41022 ...）不視為取消
                if done % 200 == 0:
                    print(f"[{done}/{len(seen)}] last code={code} -> {u}", flush=True)
            time.sleep(0.08)
    print(f"=== DONE. canceled count: {len(cancelled)} ===", flush=True)
    print(f"cancelled saved to: {out_file}", flush=True)

if __name__ == "__main__":
    main()
