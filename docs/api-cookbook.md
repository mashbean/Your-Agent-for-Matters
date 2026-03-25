# API Cookbook

## Bootstrap auth

```bash
node apps/cli/src/index.mjs auth bootstrap \
  --mode email_passphrase \
  --endpoint https://server.matters.town/graphql \
  --email your@email \
  --passphrase your-temp-passphrase
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

## Post moment with source-link comment

```bash
node apps/cli/src/index.mjs content post-moment \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --token "$MATTERS_GRAPHQL_TOKEN" \
  --content "我以為你這篇說到了要害。" \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --article-url https://matters.town/a/mfntg8vdzvwn \
  --article-title "关于所谓的“七步民主”的一些看法"
```

## Comment on an article

```bash
node apps/cli/src/index.mjs engage comment \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --token "$MATTERS_GRAPHQL_TOKEN" \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --content "<p>我以為你這篇把問題說到了制度承接這一層。</p>"
```

## Preview wallet bind

```bash
node apps/cli/src/index.mjs support bind-wallet \
  --mode existing_token \
  --endpoint https://server.matters.town/graphql \
  --token "$MATTERS_GRAPHQL_TOKEN" \
  --wallet ./secrets/matters-wallet.json
```

## Preview official support flow

```bash
node apps/cli/src/index.mjs support send-official \
  --article-id QXJ0aWNsZTo5Njg2NjE \
  --recipient-wallet-address 0x1234567890abcdef1234567890abcdef12345678 \
  --amount 3
```
