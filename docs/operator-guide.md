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
  - `stress create-run`
  - `stress resume-comments`

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
- `setUserName` 盡量先用保守格式：全小寫英數字，避免 `NAME_INVALID`
- 若要綁 email，優先送 `email_verify`
- 若收到的驗證郵件是空連結模板，改送 `email_otp`
- 用 `emailLogin(passwordOrCode=otp)` 取得 token 後再 `setPassword`
- 建帳完成後，優先補上 display name、bio、avatar、profile cover，避免把半成品帳號直接丟進 live lane

## Article 圖像策略

- Matters article tag 先控制在 3 個以內
- 若要讓文章圖片穩定顯示，優先採用：先建立 draft → 上傳 cover asset → 回寫 draft `cover` → 正文加 `figure`
- 若只做文內圖片而不設 cover，前端呈現可能不穩定

## 多帳號壓力測試 lane

- 推薦把建立帳號、產生對話計畫、進度寫回視為 `main/operator lane`
- 每個公開帳號可以對應一個獨立 agent lane / subagent
- lane 間共享 `stress-results.json`，但盡量只暴露各自需要的 wallet secret
- 若互動量較大，留言 lane 必須假設會遇到 `ACTION_LIMIT_EXCEEDED`，不要把一次成功當預設
- 續跑時優先依賴 progress file，而不是人工回想已發到哪一則

## 執行環境建議

- 不要假設互動 shell 的 env 會自然傳進 agent 執行環境
- secrets 優先走 `.env.local`、secret file 或明確 runtime injection
- Python `eth_account` 缺失時，建議提供 `ethers` fallback，降低部署摩擦
