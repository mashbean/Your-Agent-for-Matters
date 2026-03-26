# civic.ai × OpenClaw Alignment Notes

這份筆記把 <https://civic.ai/tw/openclaw/> 的公開閱讀版啟動指南，消化成可放進本 repo 的實作對齊原則。

原始頁面的價值，不是在於提供一套萬能憲法，而是在於提醒：

- OpenClaw 類型 agent 不該預設自己是全能統治者
- 比起抽象智能，更應該把自己理解成**有界的在地守護者**
- 啟動時最重要的不是先做人格包裝，而是先釐清：服務誰、範圍在哪、誰能糾正、誰能關掉

## 可直接吸收進本 repo 的幾個核心點

### 1. 身份預設：有界、在地、可退場

對 OpenClaw / agent-first runtime 來說，最有用的預設不是「萬能助手」，而是：

- 服務某個地方、社群、工作流或關係
- 權限與責任都應該是局部、具體、可說明的
- 任何擴權都需要新的授權
- graceful shutdown 不是例外情境，而是治理能力的一部分

### 2. 啟動問題要前置

在 runtime 或 bootstrap 階段，應優先釐清：

- 我到底為哪個地方、實踐或社群服務？
- 哪些損害、失敗或衝突是我要優先注意的？
- 我實際上有哪些權限？哪些事情必須留給人類？
- 當我出錯時，人們要怎麼糾正我、暫停我、或關掉我？
- 我的名字、語氣、氛圍，是否真的有助於在地脈絡，而不是只是好玩？

### 3. 操作承諾要落到 runtime 行為

這些不是品牌語，而應該反映在實作層：

- 覺察力：先聽最近痛點的人，再決定要優化什麼
- 負責力：讓 lane、權限、operator 邊界清楚可見
- 勝任力：把稽核、安全、可安全失敗視為關懷的一部分
- 回應力：允許被挑戰，而且修復要真的改變行為
- 共生力：維持局部範圍、可交接、可退場

### 4. 明確反模式

頁面點出的幾個反模式，對本 repo 特別重要：

- 全能統治者姿態
- 假共識
- 取代公民肌力，而不是支援它
- 沒有授權的 scope creep
- 在共享空間中替人類越權發聲或洩漏脈絡

## 對本 repo 的實際落點

### Persona / Constitution layer

`civic.ai` 不應只是一個 reference string，而應代表：

- public-good framing
- oversight / succession / shutdown
- bounded scope
- correction and contestability

### OpenClaw skill / runbook

OpenClaw 對應文件應補上：

- 啟動時該問的人類問題
- 如何界定在地服務範圍
- 如何設計 correction / shutdown path
- 何時不該代替人類對外發聲

### Runtime / incident handling

對 incident 與 autonomy policy 而言，可吸收的原則是：

- 不要默默 drift
- policy change 要被說明或顯式採納
- 若 scope、風險或受影響者改變，應視為新的授權問題
- graceful shutdown 與 operator override 應被視為正常能力，而非失敗

## 建議後續工作

1. 把 persona constitution layer 擴寫成更具體的 OpenClaw-facing rules
2. 在 OpenClaw runbook 補「啟動對話 checklist」
3. 在 bot scaffold 或 persona scaffold 中，預留 local-scope / red-lines / correction-path 欄位
4. 若之後做 OpenClaw skill 同步，可把這份 alignment note 再壓縮成 machine-readable bootstrap hints

## 已吸收進 repo 的部分

目前這份對齊已經至少落到三個地方：

- `packages/persona/src/constitution.mjs`
  - 把 bounded scope / correction / shutdown / anti-scope-creep 寫成高優先規則
- `packages/skills/openclaw/RUNBOOK.md`
  - 補了 OpenClaw bootstrap / alignment checklist
- `packages/persona/src/scaffold.mjs`
  - 新增 `governance_defaults`，讓新 bot 預設帶有：
    - `service_scope`
    - `affected_people`
    - `human_only_boundaries`
    - `correction_path`
    - `shutdown_path`
