# JCO ERP 內部試跑版上線計劃書 v1

更新日期：2026-03-11

## 1. 目標與定位

本版不是正式 ERP 上線，而是 **內部試跑版**。目標是先把目前已存在的多頁 HTML 原型，整理成一條可被內部人員實際走通的流程，重點放在：

1. 入口一致
2. 主版本一致
3. 測試路徑一致
4. 文件一致
5. 先能跑，再逐步補強

**本次建議不做大改程式，先做版本收斂與文件治理。**

---

## 2. 目前專案現況摘要

### 2.1 檔案結構觀察
專案主體集中在根目錄 HTML + `docs/` + `tests/`：

- 主頁面群：`erp-*.html`
- 文件：`docs/`
- 自動化測試：`tests/`
- 共用腳本：`api-connector.js`、`audit-logger.js`

### 2.2 版本分裂現況
目前至少同時存在 4 種頁面層級：

1. **正式候選版（建議保留主線）**：`*-center-notion.html` + `erp-dashboard-notion.html` + `erp-login-notion.html`
2. **另一套完整頁面**：`*-center.html`、`erp-dashboard.html`、`erp-login.html`
3. **早期 Notion 草版 / 占位版**：`erp-hr-notion.html`、`erp-inventory-notion.html`、`erp-procurement-notion.html`、`erp-production-notion.html`、`erp-quality-notion.html`
4. **備份 / 簡化 / 臨時頁**：`erp-order-center-backup.html`、`erp-order-center.html.bak`、`erp-order-simple.html`

### 2.3 最關鍵的結論
目前最像「可整理成試跑版主線」的是 **center-notion 系列**，原因：

- `docs/ERP-Complete-Manual.html` 與 screenshots 主要對應 center/notion 風格
- `tests/erp-test.js`、`tests/erp-full-test.js` 主要測 `erp-order-center-notion.html`
- `erp-dashboard-notion.html` 導向的模組頁，大多指向 `*-center-notion.html`
- 視覺與導航一致性，以 Notion/center 系列最好

**但登入路由尚未完全對齊主線**：
`erp-login-notion.html` 目前仍把 procurement / quality 等角色導向 `erp-procurement-notion.html`、`erp-quality-notion.html` 這類較早期頁面，而不是 `*-center-notion.html`。這是內部試跑前必修正的第一優先。

---

## 3. 建議的內部試跑範圍（v1）

### 3.1 試跑主線版本
建議內部試跑版主線統一採用：

- `erp-login-notion.html`
- `erp-dashboard-notion.html`
- `erp-order-center-notion.html`
- `erp-cost-center-notion.html`
- `erp-procurement-center-notion.html`
- `erp-inventory-center-notion.html`
- `erp-production-center-notion.html`
- `erp-quality-center-notion.html`
- `erp-hr-center-notion.html`
- `erp-audit-log-notion.html`

### 3.2 v1 試跑建議先聚焦流程
先不要要求 8 大模組都能深度運作，建議以以下流程作為第一波試跑：

1. **登入**
2. **Dashboard 導航**
3. **訂單中心瀏覽 / 新增 / 狀態切換**
4. **成本中心查看**
5. **採購中心查看**
6. **庫存 / 生產 / 品質 / 人事頁面可進入與基本展示正常**
7. **操作日誌可查看**

### 3.3 v1 驗收標準
內部試跑版至少應達成：

- 所有入口從登入後可進入正確頁面
- 左側導航互相可跳轉
- 不再混用占位版頁面
- 文件與測試都指向同一套頁面
- QA 可以依固定清單重複驗證

---

## 4. 分階段上線計畫

## Phase 0：版本凍結與命名治理（1 天）

### 目的
先停止版本繼續分裂。

### 要做
- 決議 `*-center-notion.html` 為試跑主線
- 在文件中明確標記：哪些頁面是主版、哪些是封存版
- 暫停新增新的 `erp-xxx-v2.html` / `final.html` / `backup2.html` 類型檔名
- 在 `docs/` 放一份版本保留/封存名單，作為團隊唯一依據

### 交付物
- `Launch-Plan-v1.md`
- `Launch-Gap-List.md`
- `Version-Retention-Plan.md`

---

## Phase 1：入口與路由對齊（1 天）

### 目的
讓使用者從登入開始就進入正確主線。

### 要做
- 修正 `erp-login-notion.html` 的角色路由，改為指向 `*-center-notion.html`
- 檢查 dashboard 與各中心頁的互相導覽是否一致
- 確認登出都回到 `erp-login-notion.html`
- 確認不存在會把人帶去舊版 `*-notion.html` 占位頁的連結

### 驗收
- admin / sales / procurement / quality / development 等角色皆能進入對應主線頁
- 無死鏈、無跳錯頁

---

## Phase 2：測試基線重整（1 天）

### 目的
讓 QA 與實際專案路徑一致。

### 目前觀察到的問題
- `tests/erp-test.js` 與 `tests/erp-full-test.js` 仍使用 `file:///Users/jerry/Desktop/JCO-ERP-System`
- 目前實際專案位置是 `/Users/jerry/Projects/JCO-ERP/JCO-ERP-System`
- `package.json` 尚未提供可直接執行的 test script
- `docs/QA-Report-2026-03-10.md` 中管理員密碼寫為 `admin123`，但實際 login 檔案中為 `jco2026`

### 要做
- 修正測試 base path
- 統一測試目標為主線頁面
- 更新 QA 文件中的帳密與頁面路徑
- 在 `package.json` 增加可執行測試腳本（例如 smoke / full）

### 驗收
- 測試能直接從當前 repo 執行
- QA 文件與實際畫面一致

---

## Phase 3：文件收斂（1 天）

### 目的
讓內部試跑不是只靠記憶，而是靠文件操作。

### 要做
- 把 `docs/ERP-Complete-Manual.html` 明確標註為對應哪一套主版本
- 補一份「內部試跑 SOP」：從登入到模組巡檢
- 把 `docs/screenshots/` 分成：主版截圖 / 歷史截圖（若需要）
- 整理 `docs/test-report.html` 的來源與更新方式

### 驗收
- 新人可只看 docs 完成基本巡檢
- 文件不再混淆 Notion / center / legacy 版本

---

## Phase 4：內部試跑執行（3~5 天）

### 建議試跑角色
- 1 位管理員
- 1 位業務
- 1 位採購
- 1 位品質 / 生產代表

### 試跑內容
- 每天固定走一次核心流程
- 記錄：頁面進不去、按鈕無反應、資料展示不合理、流程中斷
- 缺口都回填到 `Launch-Gap-List.md`

### 每日檢查點
- 登入是否正常
- 導航是否正常
- Modal 是否可開啟 / 關閉
- 表單欄位是否完整
- 是否出現 undefined / NaN / 空白卡片
- 匯入匯出是否仍需人工確認

---

## 5. 建議的主版本判定原則

未來所有新修改，先遵守以下原則：

1. **只改主線檔，不平行複製新版本**
2. 若要保留舊版，一律移到 archive 區或至少在清單中標記封存
3. 測試、手冊、截圖三者必須對應同一套頁面
4. 新功能先補在主線，再更新文件與 QA

---

## 6. 風險與提醒

### 優點
- 現有畫面資產其實已不少
- center-notion 系列已具有可展示的模組完整度
- docs 與 screenshots 已有初步基礎

### 風險
- 多版本並存，最容易造成測試結果失真
- login / dashboard / 各模組目前仍有部分路由混線
- 測試路徑與 repo 路徑不一致，會導致「以為測過，其實不是測現在這份」
- QA 文件帳密與實際程式不一致，容易讓內部試跑者誤判為系統故障

---

## 7. v1 建議結論

**先不要擴功能，先做收斂。**

JCO ERP 要進入內部試跑版，最重要的不是再多做一頁，而是把目前已存在的頁面、測試、文件收成同一條主線。以現況判斷，最合理的做法是：

- 以 `*-center-notion.html` 為試跑主版
- 修正登入與測試路徑
- 更新 QA 文件
- 封存占位版 / 備份版 / 簡化版

這樣可以在 **低風險、少改動** 的前提下，先建立「能持續整理」的基礎。