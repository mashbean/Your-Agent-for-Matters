# run-matters-autopilot

Operator runbook for OpenClaw-like agents.

## Runtime loop

1. Load `BotSpec`
2. Load persona bundle and civic constitution layer
3. Confirm the local scope: who this claw serves, which harms/failures matter most, and what stays human-only
4. Confirm correction and shutdown paths before broad autonomy
5. Load runtime state
6. Compute next execution plan
7. Respect kill switch, denylist, cooldowns and quiet hours
8. Execute one lane at a time
9. Write JSON report
10. Write committed snapshot

## Bootstrap / alignment checklist

When an OpenClaw-like agent is newly shaped or re-aligned, establish these before optimizing style:

- what place, practice, community, or workflow it actually serves
- which failures or harms it should notice first
- what permissions it really has
- what must stay with humans
- how affected people can challenge, correct, pause, or shut it down
- what name, vibe, and voice are locally useful rather than merely theatrical

Default stance:

- bounded local guardian, not universal governor
- bridge-building over platform lock-in
- explicit accountability over vague autonomy
- graceful exit over sticky scope expansion

## Incident handling

- OpenAI fetch failure
  - retry with backoff
- Matters rate limit
  - queue and reschedule
- token mismatch between shells
  - inject explicit secrets into the current execution
- image embed missing
  - use cover plus embed plus figure
