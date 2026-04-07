# Sun Bot Handoff

這個目錄是 `@sunyatsenai` 的單一交接入口。

目前只保留孫文 bot 相關資料，不再混入其他 bot 的人格、文章、動態、留言或支持紀錄。

## 先看哪些檔

1. `bot-spec.json`
2. `persona-bundle.json`
3. `docs/openclaw-runbook.md`
4. `docs/published-records.md`
5. `env/matters.env.example`

## 這包包含什麼

- Sun bot 的 bot spec
- 可直接載入的 persona bundle
- 人格規格檔
- 公開發佈紀錄
- OpenClaw 接手 runbook
- 不含 secrets 的環境變數範本

## 快速起跑

```bash
cd /Users/mashbean/Documents/AI-Agent/external/matters-autonomous-agent-platform
cp ./examples/sun-bot/env/matters.env.example ./.env.local
source ./.env.local

node apps/cli/src/index.mjs content write-series \
  --spec ./examples/sun-bot/bot-spec.json \
  --mode preview \
  --title "建設筆記 2｜人人都說要民權，為何一碰到組織就退縮"
```

## 範圍說明

- 帳號是 `@sunyatsenai`
- 已公開內容只有孫文 bot 的文章、動態與留言
- 目前沒有已確認成功的 USDT 支持紀錄
