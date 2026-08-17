#!/usr/bin/env python3
# check_urls.py (self-healing, no taskkill) - 逐一用 agent-browser 開啟 URL，偵測「该分享已被取消，无法访问」
# 強化：每 RESET_EVERY 個 URL 用 agent-browser close 重置 daemon；單一 URL 失敗時重試。
# 不使用 taskkill（避免誤殺宿主 Chromium）。
# 用法: python check_urls.py <url_file> <cancelled_out_file> [reset_every]
import subprocess, sys, os, time

NODE_PREFIX = r"C:\Users\cyril\.workbuddy\binaries\node\versions\22.22.2"
AGENT = "agent-browser"
MSG = "该分享已被取消，无法访问"
FALLBACK = "分享已被取消"
RESET_EVERY = 10

def env():
    e = dict(os.environ)
    e["PATH"] = NODE_PREFIX + os.pathsep + NODE_PREFIX + r"\node_modules\.bin" + os.pathsep + e.get("PATH","")
    return e

def run(args, timeout=60):
    cmd = AGENT + " " + " ".join(args)
    try:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=timeout, env=env())
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None

def reset_daemon():
    # 只用 agent-browser close 終止 daemon（不殺 chrome 程序，避免誤傷宿主）
    run(["close"], timeout=15)
    time.sleep(1.0)

def check_one(u):
    # 最多重試 3 次；每次失敗就重置 daemon 再試
    for attempt in range(3):
        run(["open", u], timeout=60)
        run(["wait", "--load", "load"], timeout=20)
        time.sleep(0.6)
        r = run(["snapshot"], timeout=30)
        text = (r.stdout if r else "") or ""
        if (MSG in text) or (FALLBACK in text):
            return True
        if text.strip():
            return False  # 有內容但不是取消訊息
        # 空白/逾時 -> 重置後重試
        reset_daemon()
    return False

def main():
    url_file = sys.argv[1]
    out_file = sys.argv[2]
    if len(sys.argv) > 3:
        global RESET_EVERY
        RESET_EVERY = int(sys.argv[3])
    urls = []
    with open(url_file, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            u = line.split("\t")[0].strip()
            if u:
                urls.append(u)
    print(f"total urls to check: {len(urls)} (reset every {RESET_EVERY})", flush=True)

    reset_daemon()
    cancelled = []
    with open(out_file, "w", encoding="utf-8") as out:
        for i, u in enumerate(urls, 1):
            if i > 1 and (i-1) % RESET_EVERY == 0:
                print(f"-- reset daemon at {i} --", flush=True)
                reset_daemon()
            hit = check_one(u)
            if hit:
                cancelled.append(u)
                out.write(u + "\n"); out.flush()
                print(f"[{i}/{len(urls)}] CANCELLED -> {u}", flush=True)
            else:
                print(f"[{i}/{len(urls)}] ok -> {u}", flush=True)
    print(f"=== DONE. cancelled count: {len(cancelled)} ===", flush=True)
    print(f"cancelled saved to: {out_file}", flush=True)
    reset_daemon()

if __name__ == "__main__":
    main()
