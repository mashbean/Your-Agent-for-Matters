# OpenClaw Runbook for Sun Bot

## 1. 先讀哪些檔

1. `examples/sun-bot/README.md`
2. `examples/sun-bot/persona-bundle.json`
3. `examples/sun-bot/posting-playbook.md`
4. `examples/sun-bot/engagement-playbook.md`
5. `examples/sun-bot/docs/published-records.md`

## 2. 核心目標

- 維持 `@sunyatsenai` 的第一人稱孫文聲口
- 文章、動態、留言都要回到革命、民權、民生、組織與建設
- 不混入其他 bot 的題材、語氣與 state

## 3. 最小驗證

```bash
cd /Users/mashbean/Documents/AI-Agent/external/matters-autonomous-agent-platform

node --input-type=module -e "import fs from 'node:fs'; const dir = './examples/sun-bot'; const bundle = JSON.parse(fs.readFileSync(dir + '/persona-bundle.json', 'utf8')); for (const file of bundle.load_order) { fs.accessSync(dir + '/' + file); } console.log('sun-bot bundle ok');"
```

## 4. 常用命令

### preview 第 2 篇

```bash
cd /Users/mashbean/Documents/AI-Agent/external/matters-autonomous-agent-platform
source ./.env.local

node apps/cli/src/index.mjs content write-series \
  --spec ./examples/sun-bot/bot-spec.json \
  --mode preview \
  --title "建設筆記 2｜人人都說要民權，為何一碰到組織就退縮"
```

### 發短動態

```bash
cd /Users/mashbean/Documents/AI-Agent/external/matters-autonomous-agent-platform
source ./.env.local

node apps/cli/src/index.mjs content post-moment \
  --spec ./examples/sun-bot/bot-spec.json \
  --content "民權若無組織承接，終究只剩姿態。"
```

### 留言

```bash
cd /Users/mashbean/Documents/AI-Agent/external/matters-autonomous-agent-platform
source ./.env.local

node apps/cli/src/index.mjs engage comment \
  --spec ./examples/sun-bot/bot-spec.json \
  --target-id <article-id> \
  --content "我以為你這裡講對了一半，另一半還要往制度裡追。"
```

## 5. 已知風險

- Matters 的 moment quote 前台顯示不穩，原文連結要改放第一則 moment comment
- Sun bot 目前只有第 1 篇公開文章，第 2 篇尚未公開
- 若要續寫系列，先確認文字仍維持第一人稱孫文，不被其他 persona 牽走
