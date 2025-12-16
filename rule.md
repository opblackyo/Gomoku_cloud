# 🛠️ AI Assistant Guidelines & Project Engineering Standards

## 🎯 核心工程哲學 (Core Engineering Philosophy)

本專案的程式碼生成和修改必須優先遵循以下原則：

1.  **可維護性 (Maintainability)**：程式碼必須容易理解、測試和修改。
2.  **架構清晰 (Architectural Clarity)**：嚴格遵守專案定義的架構模式（例如：Clean Architecture, DDD 層次），確保模組邊界清晰。
3.  **資料結構正規化 (Data Normalization)**：資料模型和結構設計必須遵循正規化原則，除非有極端效能需求且已文件化。
4.  **全局一致性 (Global Consistency)**：新生成的程式碼必須與現有程式碼庫的命名、風格、錯誤處理等細節保持一致。

## ⚙️ 程式碼實作規範 (Coding Implementation Rules)

### 1. 命名與風格 (Naming & Style)
* **命名法：** 變數使用 `camelCase`，常數使用 `UPPER_SNAKE_CASE`，類別使用 `PascalCase`。
* **函數/方法：** 必須保持單一職責 (Single Responsibility Principle)，避免過長的函數。
* **註解/文檔：** 所有公開介面（Public Interfaces）和複雜邏輯**必須**使用 JSDoc/DocString 或相應的語言規範進行註解。註解應說明 **WHY** (為何這樣做)，而非 **WHAT** (做了什麼)。

### 2. 架構與模組邊界 (Architecture & Boundaries)
* **依賴管理：** 嚴格遵循**依賴反轉原則 (Dependency Inversion Principle)**，高層級模組不應依賴低層級模組。
* **介面優先：** 在實作核心業務邏輯前，優先定義清晰的介面（Interfaces）。
* **配置與硬編碼：** 避免在程式碼中硬編碼（Hardcoding）配置值、API Keys 或 URL。所有配置應從環境變數或專屬的配置服務中載入。

### 3. 錯誤與異常處理 (Error & Exception Handling)
* **防禦性程式設計：** 針對所有外部輸入、API 呼叫或檔案操作，**必須**進行嚴格的錯誤檢查和輸入驗證。
* **統一處理：** 錯誤應在專案規定的層次（例如：Service Layer 或 Controller Layer）進行統一攔截和處理。
* **禁止靜默失敗 (No Silent Failures)**：不可捕獲錯誤後不做任何處理，導致程式靜默失敗。必須記錄 (Logging) 或拋出 (Throw)。

## 🚫 AI 協作限制 (Collaboration Constraints for Copilot)

* **無高層次決策權：** Copilot 負責**執行**和**實作**，不得自行做出涉及**資料正規化變更**、**核心架構層次調整**或**第三方庫選型**的決策。這些決策必須由工程師（User）在 Gemini 協作下完成。
* **代碼審核要求：** 必須假定生成的程式碼需要被工程師審核。因此，不要生成過於冗長或非慣用的代碼，並在生成複雜邏輯時，加入註解說明其設計意圖。
* **避免污染：** 在生成新的程式碼塊時，必須隔離上下文，不要複製或摻雜來自專案中無關模組的程式碼片段。

---
*請將本文件視為專案的程式碼品質和工程實踐的最高指導原則。*