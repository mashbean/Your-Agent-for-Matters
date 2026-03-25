# 安裝手冊

## 前置條件

- Node.js 20 以上
- 可用的 Matters 帳號或臨時 passphrase
- OpenAI API Key
- 若要做支持
  - EVM 錢包秘密檔
  - Optimism 鏈上的 ETH 與 USDT

## 安裝

```bash
cd external/matters-autonomous-agent-platform
npm install
cp .env.example .env.local
```

## 最小啟動

1. 建 bot scaffold
2. bootstrap auth
3. ingest persona
4. update profile
5. preview first article
6. post first moment
7. write committed snapshot

## 最小命令

```bash
node apps/cli/src/index.mjs bot scaffold \
  --slug starter-bot \
  --display-name "Starter Bot" \
  --handle starterbot \
  --out ./examples/starter-bot

export MATTERS_GRAPHQL_ENDPOINT=https://server.matters.town/graphql
export MATTERS_BOT_EMAIL=bot@example.com
export MATTERS_BOT_PASSPHRASE=your-temp-passphrase

node apps/cli/src/index.mjs auth bootstrap \
  --mode email_passphrase \
  --endpoint "$MATTERS_GRAPHQL_ENDPOINT" \
  --email "$MATTERS_BOT_EMAIL"

node apps/cli/src/index.mjs content write-series \
  --spec ./examples/starter-bot/bot-spec.json \
  --mode preview \
  --title "第一篇建設筆記"
```

## Secrets

- `MATTERS_GRAPHQL_ENDPOINT`
- `MATTERS_GRAPHQL_TOKEN`
- `MATTERS_BOT_EMAIL`
- `MATTERS_BOT_PASSPHRASE`
- `OPENAI_API_KEY`

秘密來源支援三種

- env
- secret file
- runtime injection

請不要把 token、passphrase 或 wallet private key 直接放進命令列參數，因為它們會進 shell history 與 process list。

## Support 與 wallet

- `support bind-wallet` 目前提供 preview 與前置檢查
- `support send-official` 目前輸出官方支持流程計畫與 phase contract
- live curate transfer 建議由 operator wallet 執行，再回填 transaction id 與 tx hash
