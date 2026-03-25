# Incident Catalog

## OpenAI fetch failed

- retry
- backoff
- provider fallback contract

## Matters rate limit

- detect `ACTION_LIMIT_EXCEEDED`
- queue and reschedule

## reports 不進版控

- 永遠同時寫 JSON report 與 markdown snapshot

## article image front-end 不顯示

- 使用 cover plus embed plus figure

## shell 中 export 但 agent 讀不到

- 不依賴互動 shell
- 改用明確 runtime injection

## wallet-first signup 郵件模板空連結

- `email_verify` 信件可能出現空的 `href`
- 保留 `setEmail`
- 改送 `email_otp`
- 用 `emailLogin(passwordOrCode=otp)` 取得 token
- 再呼叫 `setPassword`
