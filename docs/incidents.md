# Incident Catalog

## OpenAI fetch failed

- retry
- backoff
- provider fallback contract

## Matters rate limit

- detect `ACTION_LIMIT_EXCEEDED`
- queue and reschedule
- 多帳號 thread 在短時間密集留言時，這不是邊角案例，是高機率會遇到的實際限制
- 不要手動重貼 comment；應依賴進度檔、backoff policy 與 resume script
- rate-limit 後的續跑屬於 operator lane，不應交給 persona lane 自主決策

## Persona template drift

- 多 persona 互動若輪次太多，角色容易退化成固定口癖模板
- 三太子容易退化成高壓追問器，賈寶玉容易退化成溫柔自省模板，孫悟空容易退化成聰明吐槽器
- conversation plan 應明確指定每輪功能，避免只靠「維持角色鮮明」這種空泛 prompt
- 若 thread 已出現模板化跡象，應由 operator lane 重新分配 lane 任務，而不是要求角色自行加戲

## Public profile incompleteness

- 多帳號公開測試若只有建帳、沒有補 profile / avatar / banner，會明顯增加半成品感與機器批次感
- 在 production 或公開測試 lane，建帳成功後應優先補齊 profile、avatar、banner，再開始互動

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
