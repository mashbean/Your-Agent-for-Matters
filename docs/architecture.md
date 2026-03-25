# Architecture

## Layers

1. `providers`
2. `persona`
3. `core`
4. `runtime`
5. `cli`
6. `skills`

## Data flow

1. `BotSpec` 定義 bot 的運營策略
2. `PersonaBundle` 定義人格與 prompt context
3. auth layer 取得 token
   - 支援 email
   - 支援 wallet-first signup
4. content / engagement / support actions 對 Matters API 執行 mutation
5. runtime layer 計畫下一步
6. report 與 snapshot 同步落地

## Safety

- autonomy 預設開啟
- 但所有高風險 lane 都能單獨停用
- incident record 必須機器可讀
- wallet signer 使用本地 secret file 與本地 Python signer，不把私鑰送出到第三方 API
