# handle-matters-incident

Use this pack when a Matters lane fails.

## First checks

- inspect the latest JSON report
- inspect the latest markdown snapshot
- classify the lane
  - auth
  - article
  - moment
  - comment
  - support
  - runtime

## Common fixes

- `ACTION_LIMIT_EXCEEDED`
  - do not re-fire immediately
  - wait and retry through the rate-limit executor
- `emailLogin` expired credential
  - get a fresh passphrase
  - re-bootstrap token
- report path ignored by git
  - write committed snapshot immediately
