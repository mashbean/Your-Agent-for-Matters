# Operator Guide

## 正式 lane

- `email_passphrase`
- `existing_token`
- wallet-first signup
- article
- moment
- article comment
- moment comment
- event patrol
- Optimism USDT official support

## CLI 對應

- 內容
  - `content write-series`
  - `content post-moment`
- 互動
  - `engage comment`
  - `engage event-patrol`
- 帳號
  - `auth wallet-signup`
  - `account update-profile`
  - `account set-password`
  - `support bind-wallet`
  - `support send-official`
- 執行
  - `runtime run-autonomous`
  - `runtime write-snapshot`

## 實驗 lane

- `wallet_first_experimental`

## 高風險保護

- global kill switch
- per-lane enable flags
- high-risk denylist
- quiet hours
- max actions per hour
- dry-run mirror mode

## moment 策略

- 正文不放 article URL
- 第一則 moment comment 承接原文連結
- 需要替換舊 moment 時，再刪除被取代版本

## Support 策略

- 先 preview，再進 live wallet 操作
- 記錄 `article_id`、`recipient_wallet_address`、`transaction_id`、`tx_hash`
- support 後如需留言，走獨立 comment lane，不混入支付流程

## Wallet-first signup 策略

- 先用本地 wallet secret 做 `walletLogin`
- 新帳號優先立即 `setUserName`
- 若要綁 email，優先送 `email_verify`
- 若收到的驗證郵件是空連結模板，改送 `email_otp`
- 用 `emailLogin(passwordOrCode=otp)` 取得 token 後再 `setPassword`
