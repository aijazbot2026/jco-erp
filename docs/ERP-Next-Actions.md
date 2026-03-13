# JCO ERP Next Actions

更新日期：2026-03-11
目標：把 JCO ERP 收斂成「內部可上線試跑版」
原則：**先收斂入口、測試、文件，不做大改程式**

---

## 一句話結論

目前最大的阻塞不是功能不夠，而是 **主線不一致**：
- 登入會把不同角色導到不同世代頁面
- 自動化測試還在跑舊路徑
- QA / 手冊 / SOP 寫的頁面與帳密不完全對齊現在主線
- 缺一份正式的試跑 QA Checklist 與短版試跑流程

**建議先把 `erp-login-notion.html` + `erp-dashboard-notion.html` + `*-center-notion.html` 定為唯一試跑主線。**

---

## 已確認的現況證據

### 1) 登入導向缺口
`erp-login-notion.html` 目前角色路由為：
- `admin` → `erp-dashboard-notion.html`
- `sales` → `erp-order-center-notion.html`
- `development` → `erp-cost-center-notion.html`
- `procurement` → `erp-procurement-notion.html`
- `quality` → `erp-quality-notion.html`

問題：
- `procurement`、`quality` 仍被導到較早期的 `*-notion.html`
- 但目前建議主線其實是 `*-center-notion.html`
- `inventory` / `production` / `hr` 雖有 `*-center-notion.html`，登入路由未納入

### 2) 測試路徑不一致
- `tests/erp-test.js` 仍寫死：
  - `file:///Users/jerry/Desktop/JCO-ERP-System/erp-order-center-notion.html`
- `tests/erp-full-test.js` 仍寫死：
  - `baseUrl: 'file:///Users/jerry/Desktop/JCO-ERP-System'`

實際 repo 位置是：
- `/Users/jerry/Projects/JCO-ERP/JCO-ERP-System`

這代表目前測試結果可能不是跑現在這份專案。

### 3) QA 文件缺口
已確認以下不一致：
- `docs/QA-Report-2026-03-10.md` 仍寫 admin 密碼是 `admin123`
- 但 `erp-login.html` / `erp-login-notion.html` 內實際是 `jco2026`
- QA 報告仍寫主系統位置是 `~/Desktop/JCO-ERP-System/`
- `docs/ERP-Complete-Manual.html` 目前多處仍標示 `erp-order-center.html`、`erp-cost-center.html`、`erp-procurement-center.html` 等非 notion 主線
- `docs/SOP-訂單中心.html` 也仍寫「開啟 `erp-order-center.html`」
- 專案內 **沒有** `docs/ERP-QA-Checklist.md`，但交付前其實需要一份固定清單

---

## 優先順序總表

| Priority | 項目 | 目的 | 預估改動量 |
|---|---|---|---|
| P0 | 定義唯一試跑主線 | 停止版本混線 | 小 |
| P0 | 修正登入導向 | 所有角色進同一世代頁面 | 小 |
| P0 | 修正測試路徑 | 讓 QA 測的是現在 repo | 小 |
| P0 | 補/修 QA 文件 | 降低誤判與溝通成本 | 小 |
| P1 | 建立 ERP-QA-Checklist | 交付前可重複驗證 | 小 |
| P1 | 補短版試跑 SOP | 讓內部同事照表走流程 | 小 |
| P1 | 統一文件首頁版本標記 | 文件與主線綁定 | 小 |
| P2 | 整理 legacy / backup 身份 | 避免誤開誤測 | 中 |
| P2 | 擴各模組 smoke test | 提高試跑可信度 | 中 |

---

# P0：今天就該做

## P0-1. 正式定義唯一試跑主線

### 要做
將以下檔案公告為 **內部試跑唯一主線**：
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

### 建議執行
1. 在 `docs/Version-Retention-Plan.md` 增加一段「本週試跑一律只用上述主線」。
2. 在 `docs/Launch-Plan-v1.md` 開頭加粗標註同樣內容。
3. 所有新文件、QA、測試報告首頁都標「適用版本：center-notion 主線」。

### 驗收標準
- 團隊不再拿 `*-center.html`、`*-notion.html`、`backup/simple` 當試跑入口
- 文件與測試都只引用主線

---

## P0-2. 修正登入導向到同一條主線

### 要做
在 `erp-login-notion.html` 調整角色路由：
- `procurement` → `erp-procurement-center-notion.html`
- `quality` → `erp-quality-center-notion.html`

### 建議順便補齊
如果登入帳號資料中已存在或即將加入對應部門，預先規劃：
- `inventory` → `erp-inventory-center-notion.html`
- `production` → `erp-production-center-notion.html`
- `hr` → `erp-hr-center-notion.html`

### 原因
現在使用者會從 login 直接掉進不同世代頁面，試跑數據會失真。

### 驗收標準
- 每個部門從 login 進入後，都到 `*-center-notion.html` 或 dashboard-notion 主線
- 不再從 login 進入 `erp-procurement-notion.html` / `erp-quality-notion.html`

---

## P0-3. 修正測試腳本路徑，讓 QA 真正在測現在 repo

### 要做
修正：
- `tests/erp-test.js`
- `tests/erp-full-test.js`

### 建議改法（優先順序）
1. **最佳解**：改成用 `path.resolve(__dirname, '..')` 組 `file://` 路徑
2. 次佳：把 repo 路徑改成現在正確位置
3. 不建議再寫死 Desktop 路徑

### 建議補的 package scripts
在 `package.json` 增加：
- `test:smoke`
- `test:full`

例如：
- `node tests/erp-test.js`
- `node tests/erp-full-test.js`

### 驗收標準
- 從 repo 根目錄直接執行測試可用
- `docs/test-report.html` 能由目前 repo 重新產出
- QA 結論可追溯到當前版本

---

## P0-4. 修正 QA 報告中的錯帳密、錯路徑、錯版本指向

### 要做
更新 `docs/QA-Report-2026-03-10.md`：
1. 管理員帳密改為：
   - `admin / jco2026`
2. 主系統位置改為目前 repo：
   - `/Users/jerry/Projects/JCO-ERP/JCO-ERP-System`
3. 註明此次 QA 適用主線：
   - `erp-login-notion.html`
   - `erp-dashboard-notion.html`
   - `*-center-notion.html`
4. 把「待手動測試」流程改成主線頁面名稱

### 驗收標準
- 內部同事依 QA 文件可正確登入
- QA 文件不再讓人誤以為系統壞掉

---

# P1：這週內補齊

## P1-1. 建立 `docs/ERP-QA-Checklist.md`

### 為什麼這個要補
目前有 QA Report，但沒有 **固定可重複執行的交付清單**。這會讓每次測試都靠記憶。

### 建議內容
至少包含以下區塊：

#### A. 入口 / 路由
- [ ] `erp-login-notion.html` 可開啟
- [ ] admin 可登入
- [ ] sales 可登入
- [ ] procurement / quality 角色登入後導到 `*-center-notion.html`
- [ ] 登出可回到 login

#### B. 導航
- [ ] dashboard 可開
- [ ] 訂單 / 成本 / 採購 / 庫存 / 生產 / 品質 / 人事 / 日誌頁可開
- [ ] 左側導航互相跳轉正常

#### C. 核心互動
- [ ] 新增訂單 modal 可開 / 可關
- [ ] 狀態切換 modal 可開 / 可關
- [ ] 搜尋欄可輸入
- [ ] tab 可切換

#### D. 畫面品質
- [ ] 無 `undefined`
- [ ] 無 `NaN`
- [ ] 無空白卡片
- [ ] 無死鏈

#### E. 文件一致性
- [ ] QA 報告帳密與程式一致
- [ ] 手冊與 SOP 指向主線頁
- [ ] 測試腳本路徑與 repo 一致

### 驗收標準
- 之後每次交付前都能跑同一份 Checklist

---

## P1-2. 補一份「內部試跑 SOP」短版文件

### 建議新增
- `docs/Internal-Pilot-SOP.md`

### 建議內容
用 1 頁完成：
1. 開 `erp-login-notion.html`
2. 用 demo 帳號登入
3. 確認 dashboard
4. 進訂單中心看列表、tab、modal
5. 巡檢成本/採購/庫存/生產/品質/人事
6. 回報格式：頁面 / 問題 / 重現步驟 / 截圖

### 驗收標準
- 新加入的內部測試人員 5 分鐘內知道怎麼跑

---

## P1-3. 修正手冊與 SOP 的版本指向

### 要做
檢查並修正至少以下文件：
- `docs/ERP-Complete-Manual.html`
- `docs/SOP-訂單中心.html`
- `docs/ERP-SOP-Manual-Notion.html`

### 目前已看到的問題
- `ERP-Complete-Manual.html` 多處仍顯示 `erp-order-center.html` / `erp-cost-center.html` 等 reference 版本
- `SOP-訂單中心.html` 仍寫「開啟 `erp-order-center.html`」

### 建議修法
每份文件首頁都加：
- 適用版本：`center-notion 主線`
- 更新日期
- 非主線頁面僅供參考，不作試跑入口

### 驗收標準
- 手冊與 SOP 都不再把人帶去 reference 版本

---

## P1-4. 補 `docs/test-report.html` 的來源說明

### 要做
在 `docs/test-report.html` 或旁邊補說明文件，寫清楚：
- 由哪支 script 產出
- 使用哪個頁面主線
- 何時更新
- 是否為最新結果

### 原因
現在測試報告存在，但更新方式沒有制度化。

---

# P2：收尾整理

## P2-1. 幫 legacy / backup 檔案加上明確身份

### 建議標記為 legacy / archive 的檔案
- `erp-procurement-notion.html`
- `erp-inventory-notion.html`
- `erp-production-notion.html`
- `erp-quality-notion.html`
- `erp-hr-notion.html`
- `erp-order-center-backup.html`
- `erp-order-center.html.bak`
- `erp-order-simple.html`

### 做法
先不一定要搬檔，但至少：
1. 在 `docs/Version-Retention-Plan.md` 明寫不可作試跑入口
2. 之後再考慮搬到 `archive/`

---

## P2-2. 擴充各模組 smoke test

### 目前現況
現有 Playwright 主要偏重：
- login
- dashboard
- order center

### 建議最低補測
每個中心頁至少驗：
- 頁面可開
- 左側導航存在
- 主要 tab 可切
- 主要按鈕可點
- modal 可開關（若有）
- 無 `undefined/NaN`

### 建議模組順序
1. procurement
2. cost
3. inventory
4. production
5. quality
6. hr

---

# 建議執行順序（可直接照做）

## 今日版
1. 修 `erp-login-notion.html` 路由
2. 修 `tests/erp-test.js`、`tests/erp-full-test.js` 路徑
3. 補 `package.json` 測試 scripts
4. 修 `docs/QA-Report-2026-03-10.md`
5. 新增 `docs/ERP-QA-Checklist.md`

## 本週版
6. 修 `docs/ERP-Complete-Manual.html` 版本指向
7. 修 `docs/SOP-訂單中心.html` 版本指向
8. 新增 `docs/Internal-Pilot-SOP.md`
9. 補 `docs/test-report.html` 來源說明
10. 把 legacy / backup 身份寫進 `Version-Retention-Plan.md`

---

# 不建議現在做的事

以下先不要投入太多時間：
- 大規模重構 UI
- 一次整合所有 reference 版功能回主線
- 搬大量檔案結構
- 新增大量模組功能

原因：現在最缺的是 **一致性**，不是更多頁面。

---

# 最後判斷

JCO ERP 現在已經有足夠素材進入內部試跑，但前提是先把這 4 件事收乾淨：
- **登入一致**
- **測試一致**
- **文件一致**
- **主版本一致**

只要 P0 做完，這套 ERP 就會從「多版本原型」提升到「可被內部反覆試跑的候選版」。
