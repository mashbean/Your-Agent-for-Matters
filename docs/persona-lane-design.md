# Persona Lane Design for Multi-Agent Matters Threads

這份文件整理一個在 Matters 公開 thread 中運行多 persona agent 的實務方法。重點不是替角色寫設定檔而已，而是為每個角色指定在討論中的功能位置。

## 核心原則

1. **persona 要有 lane，不要只有人設。**
2. **同一串討論裡，每個角色都要知道自己是來做什麼。**
3. **角色辨識度來自功能分工與節奏，不只來自語氣詞。**
4. **operator lane 與 persona lane 必須分離。**

## 一個可工作的三 lane 結構

### Lane A：主場／情感承接者
範例：賈寶玉

適合任務：
- 發原始 moment
- 設定討論的情緒門檻
- 承接他人的不安、疑惑、遲疑
- 把衝突維持在可回應狀態

風險：
- 容易變成過度柔軟、句句都像感受型模板

### Lane B：破題／追問者
範例：三太子

適合任務：
- 在 thread 一開始提出高辨識度追問
- 當討論開始漂浮時重新定錨
- 把漂亮話拉回責任、立場、後果

風險：
- 容易變成固定的怒氣模板
- 若沒有節制，會讓 thread 只剩對抗感

### Lane C：節奏切換／翻譯者
範例：孫悟空

適合任務：
- 把抽象論述翻成人話
- 讓 thread 從過度正經中透氣
- 在不同角色之間做語言轉譯

風險：
- 容易為了 witty 而犧牲實質內容
- 若過度表演，會破壞整體可信度

## 什麼 prompt 會讓人格變扁

以下設計容易讓 persona 很快退化成模板：

- 只給一句角色描述，沒有 lane 任務
- 每輪都要求「保持角色鮮明」
- 只要求模仿口氣，不指定本輪功能
- 不區分主場帳號與側翼帳號
- 沒有定義哪類判斷屬於 operator lane

## 什麼 prompt 比較能保住角色辨識度

比較好的做法是每輪都同時指定：

- 你是誰
- 你這一輪負責什麼功能
- 你不能做什麼
- 這輪要補的是 thread 的哪個缺口

例如：

- 賈寶玉：這一輪只負責承接與深化，不負責主導結論
- 三太子：這一輪只負責把抽象話拉回責任與代價
- 孫悟空：這一輪負責翻譯前面兩人的差異，不新增新議題

## 什麼事不能交給 persona lane

下列事項預設屬於 operator lane：

- 節流與退避
- 是否刪文、重發、換 thread
- comment rate limit 之後的 resume 決策
- credentials / wallet / token 管理
- incident escalation

原因很簡單：這些決策若交給 persona improvisation，很容易讓 thread 看起來像角色在亂跳戲，其實只是系統在自救。

## 實務建議

- 先有 conversation plan，再讓 persona 逐輪執行
- 每輪只指定一個明確功能，避免角色同時承擔太多任務
- 若要長 thread，必須監控 template drift
- 若要公開測試，profile 應清楚標示為 AI 測試或平台實驗帳號

## 結語

多 persona Matters thread 的設計，本質上不是寫三份人物設定，而是做一種多 agent 公開互動編排。

當 persona 有明確 lane、operator 與 persona 邊界清楚、conversation plan 按輪次設計時，角色辨識度、互動可讀性與可恢復性才會一起上升。
