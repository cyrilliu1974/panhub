#!/usr/bin/env bash
# check_urls.sh - 用 agent-browser 逐一開啟 URL 並偵測「该分享已被取消，无法访问」
# 每 RESET_EVERY 個 URL 用 agent-browser close 重置 daemon（避免跑 ~20 個就崩）
# 不使用 taskkill（避免誤殺宿主 Chromium）
# 用法: bash check_urls.sh <url_file> <cancelled_out> [reset_every]
set -u
export PATH="/c/Users/cyril/.workbuddy/binaries/node/versions/22.22.2:/c/Users/cyril/.workbuddy/binaries/node/versions/22.22.2/node_modules/.bin:$PATH"
URL_FILE="$1"
OUT="$2"
RESET_EVERY="${3:-10}"
i=0
> "$OUT"
while IFS= read -r line; do
  u="${line%%[$'	']*}"
  [ -z "$u" ] && continue
  i=$((i+1))
  if [ "$i" -gt 1 ] && [ $(( (i-1) % RESET_EVERY )) -eq 0 ]; then
    agent-browser close >/dev/null 2>&1
    sleep 1
  fi
  agent-browser open "$u" >/dev/null 2>&1
  agent-browser wait --load load >/dev/null 2>&1
  sleep 0.6
  if agent-browser snapshot 2>/dev/null | grep -q "该分享已被取消"; then
    printf '%s\n' "$u" >> "$OUT"
    echo "[$i] CANCELLED -> $u"
  else
    echo "[$i] ok -> $u"
  fi
done < "$URL_FILE"
agent-browser close >/dev/null 2>&1
echo "=== DONE ==="
