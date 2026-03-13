# JCO ERP 主版本保留 / 封存名單

更新日期：2026-03-11

## 目的
本文件用來明確定義：

1. 哪些檔案是 **內部試跑主版本**
2. 哪些檔案是 **可暫留但不作主入口**
3. 哪些檔案應列為 **封存/歷史版本**

原則：**同一模組只保留一條主線。**

---

## A. 建議保留為主版本（Master for Internal Pilot）

以下檔案建議列為 **內部試跑版主線**：

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
- `api-connector.js`
- `audit-logger.js`
- `notion-style.css`

### 保留理由
- 視覺語言相對一致
- center-notion 系列之間已有互相導覽
- docs/screenshot/manual 的描述，多數偏向這一條線
- 現有自動化測試主要也以 notion 版為基礎

### 注意
雖然此系列是建議主版，但 `erp-login-notion.html` 仍需修正部分角色路由，才算真正完成主線收斂。

---

## B. 建議保留為參考版（Reference Only / 不作主入口）

以下檔案可以先留著，作為功能對照或未來補功能時參考，但 **不應作為內部試跑入口**：

- `erp-dashboard.html`
- `erp-order-center.html`
- `erp-cost-center.html`
- `erp-procurement-center.html`
- `erp-inventory-center.html`
- `erp-production-center.html`
- `erp-quality-center.html`
- `erp-hr-center.html`
- `erp-login.html`

### 保留理由
- 可能保有部分較完整功能或較早完成的互動內容
- 可作為未來主線補功能時的參照來源

### 管理方式
- 在文件中標記為 `reference`
- 不從 login / dashboard / docs 主流程導向這些檔案
- 不作為 QA 試跑標準

---

## C. 建議列為封存版（Archive / Legacy）

以下檔案建議列入封存：

### 1. 早期 Notion 占位頁
- `erp-procurement-notion.html`
- `erp-inventory-notion.html`
- `erp-production-notion.html`
- `erp-quality-notion.html`
- `erp-hr-notion.html`

### 判定理由
- 體積明顯較小
- 多數導航為 `href="#"` 或占位結構
- 已有對應的 `*-center-notion.html` 可取代
- 若繼續混在主線會造成角色導向混亂

---

### 2. 備份 / 簡化 / 臨時頁
- `erp-order-center-backup.html`
- `erp-order-center.html.bak`
- `erp-order-simple.html`

### 判定理由
- 非主入口
- 容易誤被打開測試
- 不適合作為內部試跑基礎

---

## D. 文件與測試檔的保留建議

### 建議保留
- `docs/ERP-Complete-Manual.html`
- `docs/ERP-SOP-Manual-Notion.html`
- `docs/SOP-訂單中心.html`
- `docs/QA-Report-2026-03-10.md`
- `docs/test-report.html`
- `tests/erp-test.js`
- `tests/erp-full-test.js`

### 但需整理
- `QA-Report-2026-03-10.md` 內容需校正帳密與路徑
- `test-report.html` 需補「由哪支 script 產生」說明
- `tests/*.js` 需改為指向目前 repo，並統一測主線頁面

---

## E. 建議的檔案管理策略

### 1. 根目錄只留主線 + 參考版
根目錄不應再堆積 backup/simple/bak 類檔案。

### 2. 封存版未來建議搬移
若後續允許整理檔案，可建立：

- `archive/legacy-notion/`
- `archive/backups/`
- `archive/prototypes/`

把以下檔案搬入：
- 早期 `*-notion.html`
- `erp-order-center-backup.html`
- `erp-order-center.html.bak`
- `erp-order-simple.html`

### 3. 文件要標記適用版本
每一份手冊、QA、測試報告，首頁都應標示：
- 適用主版檔名
- 更新日期
- 是否為最新版本

---

## F. 最終建議

### 內部試跑只認這一條主線
- `login-notion`
- `dashboard-notion`
- `*-center-notion`

### 其他檔案的定位
- `*-center.html`：保留為參考版
- `*-notion.html`（非 center）：封存
- `backup / bak / simple`：封存

---

## 簡表

| 類別 | 檔案群 | 建議 |
|---|---|---|
| 主版本 | `erp-login-notion.html`、`erp-dashboard-notion.html`、`*-center-notion.html` | 保留並作為試跑主線 |
| 參考版本 | `*-center.html`、`erp-login.html`、`erp-dashboard.html` | 保留參考，不作主入口 |
| 歷史/占位版本 | `*-notion.html`（非 center） | 封存 |
| 備份/簡化版本 | `backup`、`.bak`、`simple` | 封存 |

---

## 結論

目前最需要的不是刪檔，而是 **先定身份**。

只要先把每個檔案標成：主版 / 參考 / 封存，JCO ERP 就能從「版本混戰」進到「可以管理的試跑基礎」。