# Agent Stress Test Runbook

這份 runbook 整理一個可公開揭露的多帳號壓力測試流程，目標不是偽裝真人，而是讓平台 owner 或 operator 能系統化驗證：

1. 一次性建立多個 AI 測試帳號
2. 把不同帳號交給不同 agent lane / subagent 控制
3. 在同一則短動態下，持續跑多輪公開互動

## 內容概覽

- `examples/agent-stress-test/accounts.example.json`
  - 多帳號設定檔
- `examples/agent-stress-test/run-stress-test.mjs`
  - 一次建立多帳號、補 profile、產 moment 與首輪留言
- `examples/agent-stress-test/resume-comments-with-backoff.mjs`
  - 遇到 Matters comment rate limit 後，用 backoff 方式續跑

## 適用情境

- 平台 owner 驗證多 agent 在 Matters 上的公開互動能力
- 測試不同 persona lane 是否能分工控制不同帳號
- 壓測短動態 thread 在節流與中斷後的恢復能力

## 先決條件

```bash
export MATTERS_GRAPHQL_ENDPOINT=https://server.matters.town/graphql
export OPENAI_API_KEY=your-openai-key
export OPENAI_TEXT_MODEL=gpt-5.2
export OPENAI_IMAGE_MODEL=gpt-image-1
```

## 1. 一次性建立多帳號並發出首輪互動

```bash
node examples/agent-stress-test/run-stress-test.mjs \
  --config ./examples/agent-stress-test/accounts.example.json \
  --out ./tmp/agent-stress-test-run
```

這支腳本會完成：

- 依設定檔建立多組 wallet-first Matters 帳號
- 為每個帳號生成 avatar / banner
- 更新 display name 與 bio
- 生成一則短動態與多輪留言計畫
- 由設定檔最後一個帳號發出 moment
- 依序補上首輪留言
- 把結果寫到 `stress-results.json`

## 2. 把不同帳號交給不同 subagent 控制

repo 本身不直接依賴 OpenClaw，但推薦的 operator pattern 是：

- `main` lane：建立帳號、產生共用 conversation plan、維護 `stress-results.json`
- `subagent A`：負責帳號 A 的 tone / response lane
- `subagent B`：負責帳號 B 的 tone / response lane
- `subagent C`：負責帳號 C 的 tone / response lane

建議實務：

- 共享同一份 `stress-results.json` 與 wallet path
- 每個 subagent 只拿自己帳號的 wallet secret
- 對外發文前，先由 main lane 生成 conversation plan 或 queue
- 若要做更強的 lane isolation，可把每個帳號拆成獨立工作目錄，各自 mount 自己的 wallet 檔

## 3. 遇到節流時續跑多輪留言

Matters 在短時間密集留言時，可能會回 `ACTION_LIMIT_EXCEEDED`。這時不要手動重貼內容，直接用續跑腳本：

```bash
node examples/agent-stress-test/resume-comments-with-backoff.mjs \
  --out ./tmp/agent-stress-test-run \
  --action-limit-ms 120000 \
  --default-retry-ms 30000 \
  --comment-delay-ms 20000
```

這支腳本會：

- 讀取 `stress-results.json`
- 重新用 wallet secret 登入每個帳號
- 從 `stress-progress.json` 的 `next_index` 接著發
- 對 rate limit 自動退避重試
- 每成功一則就寫回進度檔

## 輸出檔案

- `stress-results.json`
  - 帳號、wallet path、moment、留言計畫與已發結果
- `stress-progress.json`
  - 續跑用進度檔
- `wallets/*.json`
  - 每個測試帳號的 wallet secret
- `assets/*`
  - 生成的 avatar / banner 圖檔

## 風險控制建議

- profile / bio 明確標示為 AI 測試帳號或平台實驗帳號
- 不要把多帳號互動包裝成自然真人社交
- 把節流、刪除、重跑、替換 moment 視為 operator lane，而不是 persona lane 自主決策
- 在 production 上跑大規模多輪互動前，先用低輪數與公開標示版本驗證節流上限

## 後續可擴充方向

- 把 conversation plan 改成 per-account queue file，讓 subagent 真正各自消費自己的 lane
- 為 moment / comment lane 補 committed snapshot
- 把 retry / backoff policy 提升為 `packages/runtime` 的正式 capability
