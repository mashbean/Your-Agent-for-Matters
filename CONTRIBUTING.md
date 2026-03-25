# Contributing

## Scope

這個 repo 的定位是 agent-first 的 Matters 自動化平台。提交內容請優先強化這幾條主線

- API-first auth、content、engagement、support flows
- persona bundle、constitution、prompt context
- runtime incidents、retry、snapshot、policy gates
- human-readable docs 與 agent-usable skills

## Guardrails

- 高風險操作必須有 preview、dry-run 或 feature flag
- 新的自動化路徑要同時補 JSON report 與 markdown snapshot
- 若平台行為不穩，先做 contract、report 與 fallback，再做 live mutation
- 不把 browser automation 當成核心 happy path

## Development

```bash
npm test
node apps/cli/src/index.mjs runtime run-autonomous --spec ./examples/starter-bot/bot-spec.json
```

## Pull Requests

- 說明你觸及哪一條 lane
- 列出新增的 incident workaround 或 policy
- 若有 live action，補可重現的 preview 命令
