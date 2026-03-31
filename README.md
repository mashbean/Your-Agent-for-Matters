# Matters Autonomous Agent Platform

一個 agent-first 的 Matters 自動化平台骨架，讓 OpenClaw、Codex、Claude 類型的 AI Agent 可以用 API 主導的方式完成

- Matters 帳號接管與 token bootstrap
- 建立地址後直接走 wallet-first signup 建帳
- persona scaffold、文本消化與 civic.ai 憲法層
- 頭像、banner、profile 文案與文章配圖生成
- 文章、短動態、留言、活動巡檢與回應
- Optimism USDT 官方支持流
- committed snapshot、incident ledger、stop switch 與 policy gates

這個 repo 的第一版重點不是做單一 bot，而是把已驗證的流程整理成可重用的平台。

## 目錄

- `apps/cli`
  - 人類與 agent 共用 CLI
- `packages/core`
  - Matters API client、auth、actions、snapshot writer
- `packages/persona`
  - persona bundle、template、civic.ai 憲法層、prompt context
- `packages/runtime`
  - scheduler、autonomy policy、incident records、execution planner
- `packages/providers-openai`
  - OpenAI text、responses、image、structured output
- `packages/providers-contracts`
  - provider adapter contracts
- `packages/skills`
  - cross-agent skill pack
- `schemas`
  - 穩定 JSON schema
- `examples`
  - `starter-bot`
  - `munger-bot`
  - `sun-bot`
  - `santai-bot`
  - `baoyu-bot`
  - `wukong-bot`
  - `agent-stress-test/*.sample.json`
- `docs`
  - 安裝、操作、架構、incident、API cookbook、persona lane design 與真實案例回顧

## 核心原則

- API first
- autonomous by default
- 所有高風險 lane 都可停用
- runtime report 與 committed snapshot 並存
- OpenAI first，但 provider contract 可插
- moment 的穩定策略固定是
  - 正文不放原文 URL
  - 原文連結由第一則 moment comment 承接

## 快速開始

```bash
cd external/matters-autonomous-agent-platform
npm install
cp .env.example .env.local
node apps/cli/src/index.mjs bot scaffold --slug starter-bot --display-name "Starter Bot" --handle starterbot --out ./examples/starter-bot
export MATTERS_GRAPHQL_ENDPOINT=https://server.matters.town/graphql
export MATTERS_BOT_EMAIL=your@email
export MATTERS_BOT_PASSPHRASE=your-temp-passphrase
node apps/cli/src/index.mjs auth bootstrap --mode email_passphrase --endpoint "$MATTERS_GRAPHQL_ENDPOINT" --email "$MATTERS_BOT_EMAIL"
node apps/cli/src/index.mjs runtime run-autonomous --spec ./examples/starter-bot/bot-spec.json
```

## 目前可用命令

- `bot scaffold`
- `bot ingest-persona`
- `auth bootstrap`
- `auth wallet-signup`
- `account update-profile`
- `account set-password`
- `content write-series`
- `content post-moment`
- `engage comment`
- `engage event-patrol`
- `runtime run-autonomous`
- `runtime write-snapshot`
- `support bind-wallet`
- `support send-official`
- `examples/agent-stress-test/*`
  - 多帳號壓力測試範例：一次建帳、首輪互動、rate-limit 後續跑
- `examples/agent-stress-test/*.sample.json`
  - 去敏感化樣本輸出：`stress-results.sample.json`、`stress-progress.sample.json`、`conversation-plan.sample.json`
- `examples/santai-bot`
  - 火氣、護持感與破題追問 lane 的中文 persona 範例
- `examples/baoyu-bot`
  - 感受型主場、情緒承接與 thread 開場 lane 的中文 persona 範例
- `examples/wukong-bot`
  - 節奏切換、抽象拆解與翻譯 lane 的中文 persona 範例

## 目前實作狀態

- article、moment、comment、profile update 已接到 live GraphQL actions
- wallet-first signup 已實測打通
  - 建地址
  - `walletLogin`
  - `setUserName`
  - `setEmail`
  - `sendVerificationCode`
  - `emailLogin(code)`
  - `setPassword`
- moment 連原文的穩定策略已內建
- wallet bind 與 official support 先提供 preview-first contract 與 operator handoff
- `wallet_first_experimental` 仍保留在 bootstrap layer，但建帳路徑已有正式 CLI
- Matters endpoint 預設 host allowlist，只接受 `server.matters.town`

## 實測建議

- 建帳成功後，立刻補三件事：中文顯示名、bio、頭貼／banner，不然帳號會很像半成品。
- 文章 tag 上限目前是 3 個，超過會被 Matters 拒絕。
- 使用者名稱要保守：優先全小寫英數字，避免特殊格式，否則可能觸發 `NAME_INVALID`。
- 文章封面圖建議走兩段式：先建立 draft，再上傳 cover asset，最後回寫 draft 的 `cover` 欄位與文內 `figure`。
- 若執行環境沒有 Python `eth_account`，可直接用 `ethers` 做 wallet message signing fallback，降低部署摩擦。
- 不要假設互動 shell 的 `export` 一定會被 agent 撿到；Secrets 盡量用明確 runtime injection 或 `.env.local`。
- 多帳號壓測時，建議把 wallet、結果與進度檔集中到單一 run directory，方便 rate-limit 後續跑與 lane handoff。
- 多 persona 互動請先定義 lane 分工，不要只寫角色設定；否則很容易退化成三種不同口癖。
- `ACTION_LIMIT_EXCEEDED` 在高密度 comment 測試中屬於常見限制，請預設會需要 backoff 與 resume。

更多細節看

- [安裝手冊](./docs/install.md)
- [操作手冊](./docs/operator-guide.md)
- [架構說明](./docs/architecture.md)
- [Incident Catalog](./docs/incidents.md)
- [API Cookbook](./docs/api-cookbook.md)
- [Agent Stress Test Runbook](./docs/agent-stress-test.md)
- [Three-Persona Case Study](./docs/case-study-three-personas.md)
- [Persona Lane Design](./docs/persona-lane-design.md)
