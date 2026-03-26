# API Cookbook

## Bootstrap auth

```bash
export MATTERS_GRAPHQL_ENDPOINT=https://server.matters.town/graphql
export MATTERS_BOT_EMAIL=your@email
export MATTERS_BOT_PASSPHRASE=your-temp-passphrase

node apps/cli/src/index.mjs auth bootstrap \
  --mode email_passphrase \
  --endpoint "$MATTERS_GRAPHQL_ENDPOINT" \
  --email "$MATTERS_BOT_EMAIL"
```

## Wallet-first signup

```bash
export MATTERS_GRAPHQL_ENDPOINT=https://server.matters.town/graphql

node apps/cli/src/index.mjs auth wallet-signup \
  --wallet ./secrets/matters-wallet.json \
  --username walletstarterbot \
  --email your@email
```

## Wallet-first signup with email OTP fallback

```bash
node apps/cli/src/index.mjs auth wallet-signup \
  --wallet ./secrets/matters-wallet.json \
  --username walletstarterbot \
  --email your@email \
  --verification-type email_otp

node apps/cli/src/index.mjs account set-password \
  --mode email_passphrase \
  --email your@email \
  --passphrase your-email-otp-code \
  --password 'replace-with-a-real-password'
```

## Scaffold bot

```bash
node apps/cli/src/index.mjs bot scaffold \
  --slug sun-bot \
  --display-name 孫文 \
  --handle sunyatsenai \
  --out ./examples/sun-bot
```

## Preview series article

```bash
node apps/cli/src/index.mjs content write-series \
  --spec ./examples/starter-bot/bot-spec.json \
  --mode preview \
  --title "建設筆記 1｜先把制度寫出來"
```

> 注意：Matters article tag 目前實測上限為 3 個。

## Post moment with source-link comment

```bash
export MATTERS_GRAPHQL_TOKEN=your-token

node apps/cli/src/index.mjs content post-moment \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --content "我以為你這篇說到了要害。" \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --article-url https://matters.town/a/mfntg8vdzvwn \
  --article-title "关于所谓的“七步民主”的一些看法"
```

## Comment on an article

```bash
export MATTERS_GRAPHQL_TOKEN=your-token

node apps/cli/src/index.mjs engage comment \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --content "<p>我以為你這篇把問題說到了制度承接這一層。</p>"
```

## Preview wallet bind

```bash
export MATTERS_GRAPHQL_TOKEN=your-token

node apps/cli/src/index.mjs support bind-wallet \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --wallet ./secrets/matters-wallet.json
```

## Preview official support flow

```bash
node apps/cli/src/index.mjs support send-official \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --recipient-wallet-address 0x1234567890abcdef1234567890abcdef12345678 \
  --amount 3
```

## Run a disclosed multi-account stress test

```bash
node examples/agent-stress-test/run-stress-test.mjs \
  --config ./examples/agent-stress-test/accounts.example.json \
  --out ./tmp/agent-stress-test-run
```

## Resume thread comments with backoff

```bash
node examples/agent-stress-test/resume-comments-with-backoff.mjs \
  --out ./tmp/agent-stress-test-run \
  --action-limit-ms 120000 \
  --default-retry-ms 30000 \
  --comment-delay-ms 20000
```
