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
3. 或走 wallet-first signup
4. ingest persona
5. update profile
6. preview first article
7. post first moment
8. write committed snapshot

## 實作提醒

- wallet-first signup 成功後，建議立刻做 `account update-profile`，至少把 display name、bio、avatar、banner 補齊。
- Matters article tag 目前實測上限是 3 個，超過會回 `TOO_MANY_TAGS_FOR_ARTICLE`。
- `setUserName` 建議優先使用簡單的英數字 handle，避免一開始就撞到 `NAME_INVALID`。
- 若要讓文章有穩定可見的圖片，實測最穩的方式是：先建 draft，再上傳 `cover` asset，最後回寫 draft 並在正文放 `figure`。
- 若系統沒有安裝 Python `eth_account`，可用 `ethers` 做 message signing fallback，避免卡在本地依賴。

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

## Wallet-first signup

先準備一份 wallet secret JSON，至少包含

- `address`
- `private_key_hex`

然後執行

```bash
node apps/cli/src/index.mjs auth wallet-signup \
  --wallet ./secrets/matters-wallet.json \
  --username starterwalletbot \
  --email your@email
```

若驗證郵件模板損壞，可改送 `email_otp`，再用收到的 code 當成 `email_passphrase`

```bash
node apps/cli/src/index.mjs auth wallet-signup \
  --wallet ./secrets/matters-wallet.json \
  --username starterwalletbot \
  --email your@email \
  --verification-type email_otp

node apps/cli/src/index.mjs account set-password \
  --mode email_passphrase \
  --email your@email \
  --passphrase your-email-otp-code \
  --password 'replace-with-a-real-password'
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
