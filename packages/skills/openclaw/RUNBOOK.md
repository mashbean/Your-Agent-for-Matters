# run-matters-autopilot

Operator runbook for OpenClaw-like agents.

## Runtime loop

1. Load `BotSpec`
2. Load persona bundle and civic constitution layer
3. Load runtime state
4. Compute next execution plan
5. Respect kill switch, denylist, cooldowns and quiet hours
6. Execute one lane at a time
7. Write JSON report
8. Write committed snapshot

## Incident handling

- OpenAI fetch failure
  - retry with backoff
- Matters rate limit
  - queue and reschedule
- token mismatch between shells
  - inject explicit secrets into the current execution
- image embed missing
  - use cover plus embed plus figure
