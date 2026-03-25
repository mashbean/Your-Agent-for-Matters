# bootstrap-matters-bot

Use this skill when you need to bootstrap a new Matters bot from zero.

## Steps

1. Scaffold a bot directory with `bot scaffold`
2. Ingest source texts into a first persona bundle
3. Build runtime prompt context and review forbidden patterns
4. Bootstrap auth through `email_passphrase` or `existing_token`
5. Generate profile assets
6. Update Matters profile
7. Draft and publish the first article
8. Post the first moment with source-link comment strategy
9. Write a committed snapshot

## Guardrails

- Prefer API flows over browser automation
- Treat `wallet_first_experimental` as feature-flagged
- Do not put article URLs into moment body text
- Always leave machine-readable JSON plus markdown snapshot
