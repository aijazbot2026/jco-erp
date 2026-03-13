# JCO ERP 內部試跑版上線缺口清單

更新日期：2026-03-11

## 使用方式
本清單聚焦「內部試跑版」缺口，不是正式商用上線清單。優先級分為：

- **P0**：不處理就不適合試跑
- **P1**：可試跑，但體驗與可信度會受影響
- **P2**：可後補的整理項

---

## P0 缺口（試跑前必補）

### 1. 登入路由與主版本不一致
**現況**
- `erp-login-notion.html` 目前路由：
  - admin → `erp-dashboard-notion.html`
  - sales → `erp-order-center-notion.html`
  - development → `erp-cost-center-notion.html`
  - procurement → `erp-procurement-notion.html`
  - quality → `erp-quality-notion.html`
- 但目前較完整的主線其實是 `*-center-notion.html`

**風險**
- 採購 / 品質角色登入後會進到較早期頁面
- 同一套系統在不同角色下看到不同版本，內部試跑資料失真

**建議**
- 將 procurement / quality 等路由改到 `erp-procurement-center-notion.html`、`erp-quality-center-notion.html`
- 同步檢查是否還有 hr / production / inventory 類似情況

---

### 2. 測試路徑仍指向舊專案位置
**現況**
- `tests/erp-test.js`
- `tests/erp-full-test.js`

以上測試仍指向：
`file:///Users/jerry/Desktop/JCO-ERP-System`

但目前專案實際位置為：
`/Users/jerry/Projects/JCO-ERP/JCO-ERP-System`

**風險**
- 測試可能不是跑現在這份專案
- QA 結論無法作為試跑依據

**建議**
- 改用當前 repo 路徑
- 或改成相對路徑 / 動態 base path

---

### 3. QA 文件帳密與實際程式不一致
**現況**
- `docs/QA-Report-2026-03-10.md` 內寫：admin / `admin123`
- `erp-login.html` 與 `erp-login-notion.html` 內實際管理員密碼為：`jco2026`

**風險**
- 內部試跑者會誤以為登入壞掉
- 文件可信度下降

**建議**
- 立即修正文檔
- 順便統一 demo 帳號表

---

### 4. 主版本尚未正式定義
**現況**
同一模組同時存在：
- `*-center-notion.html`
- `*-center.html`
- `*-notion.html`
- backup / bak / simple 版本

**風險**
- 每個人測不同檔
- 文件、截圖、QA、實際操作無法對齊

**建議**
- 正式公告：內部試跑只認 `*-center-notion.html` 主線
- 其餘版本標記為 legacy / archive

---

## P1 缺口（試跑中高機率遇到）

### 5. `package.json` 無實用測試指令
**現況**
- `npm test` 目前只是回傳 error

**風險**
- 測試不易交接
- 每次 QA 都要人工找腳本

**建議**
- 增加 `smoke`、`test:full` 等 script
- 讓內部人員能固定執行

---

### 6. 自動化測試覆蓋偏重訂單中心
**現況**
- 現有測試主要圍繞 login / dashboard / order center
- 成本、採購、庫存、生產、品質、人事多數仍偏頁面展示，缺互動驗證

**風險**
- 其他模組看起來完整，但實際互動問題未被提早發現

**建議**
- 先做每模組最小 smoke test：
  - 頁面可開
  - tab 可切
  - 主要按鈕可點
  - modal 可開關

---

### 7. docs 與實際主版本的對應關係未寫清楚
**現況**
- `docs/ERP-Complete-Manual.html` 已相對完整
- 但沒有明確寫出「這份手冊對應哪一套檔案」

**風險**
- 若未來頁面持續調整，手冊容易與主線脫鉤

**建議**
- 在手冊首頁補註：適用版本、主版檔名、更新日期

---

### 8. 截圖資料夾未區分主版與歷史版本
**現況**
- `docs/screenshots/` 同時有 `clean-*`、`pure-*`、一般首頁截圖、notion-dashboard 等

**風險**
- 未來文件引用截圖容易混版

**建議**
- 分為：`current/`、`archive/` 或至少在命名上標示 master / legacy

---

### 9. 備份檔直接混在根目錄
**現況**
- `erp-order-center-backup.html`
- `erp-order-center.html.bak`
- `erp-order-simple.html`

**風險**
- 容易被誤開、誤測、誤引用

**建議**
- 移到 `archive/` 或至少在文件中標明不可作為測試入口

---

### 10. 文件型態偏多，但缺少試跑流程文件
**現況**
- 有完整手冊、SOP、QA 報告、test-report
- 但缺一份「今天試跑要照這個順序操作」的短版文件

**風險**
- 實際試跑人員會不知道先測哪條流程

**建議**
- 補一份 1 頁式試跑 SOP：登入 → 導航 → 訂單 → 成本 → 採購 → 其他模組巡檢

---

## P2 缺口（整理品質提升項）

### 11. 早期 `*-notion.html` 占位版仍保留可見狀態
**現況**
- `erp-hr-notion.html`
- `erp-inventory-notion.html`
- `erp-procurement-notion.html`
- `erp-production-notion.html`
- `erp-quality-notion.html`

其中多數為較小型頁面，且導覽仍大量使用 `href="#"` 占位。

**風險**
- 混淆，但不一定馬上阻塞主線

**建議**
- 標記 legacy
- 若不再使用，移出主目錄

---

### 12. `docs/test-report.html` 的更新來源未制度化
**現況**
- 測試報告存在，但未在 repo 中說明如何重產

**建議**
- 在 docs 補註：由哪支 script 產生、何時更新、是否可信任為最新結果

---

### 13. 部分頁面存在功能完整度差異
**現況觀察**
- 某些 `*-center.html` 體積較大、功能看似較豐富
- `*-center-notion.html` 視覺與導覽一致性較好

**風險**
- 若未定策略，未來可能反覆在兩條線間搬功能

**建議**
- 先固定一條主線，不做雙主線維護
- 後續若要合併功能，再以主線為基底逐步補

---

## 建議優先順序

### 第一批（立即）
1. 定義主版本
2. 修正 login 路由
3. 修正測試路徑
4. 修正 QA 帳密與頁面路徑

### 第二批（本週內）
5. 補 package.json scripts
6. 增加各模組 smoke test
7. 補試跑 SOP
8. 整理截圖與 docs 對應

### 第三批（之後）
9. 封存 legacy / backup / simple 檔
10. 重整 archive 結構
11. 逐步把功能集中回主線

---

## 結論

目前 JCO ERP 最大問題不是「沒有內容」，而是 **內容太多版本同時存在，導致主線不清**。

對內部試跑版而言，最先要補的缺口不是新功能，而是：

- 路由一致
- 測試一致
- 文件一致
- 主版本一致

只要這四件先收斂，內部試跑就有基礎。