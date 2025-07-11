# 貨運單管理功能說明

1. **託運單資料輸入與管理**

    - 使用者可新增、編輯、刪除託運單。
    - 每筆託運單需填寫：託運單號、日期、公司（客戶）、司機、噸數、貨名、裝卸地點（可多筆）、用車時間、運費、額外費用（可多筆）、備註。
    - 公司與司機可即時新增，並可於表單中直接選取。
    - 裝卸地點、額外費用支援多筆動態增減。
    - 表單有完整驗證（必填、格式、數值等）。

2. **託運單狀態管理**

    - 託運單有三種狀態：
        - `PENDING`：尚未開立發票，可編輯、刪除、選取開立發票或標記為不需開發票。
        - `INVOICED`：已開立發票，不可再編輯、刪除，且不可再被選入發票。
        - `NO_INVOICE_NEEDED`：不需開立發票，不可再編輯、刪除，且不可再被選入發票。
    - 狀態流轉規則：
        - PENDING → INVOICED：開立發票成功時自動轉換。
        - PENDING → NO_INVOICE_NEEDED：使用者主動標記。
        - INVOICED/NO_INVOICE_NEEDED → PENDING：發票刪除/作廢或還原時自動轉換。

3. **列表與查詢**

    - 支援依日期、司機、公司（客戶）等條件篩選託運單。
    - 支援依託運單號查詢。
    - 託運單列表顯示是否已開立發票。

    **分組（Grouping）顯示**

    - 使用者可在託運單列表頁，選擇依下列任一欄位進行分組顯示：
        - 司機（Driver）
        - 公司（Company/客戶）
        - 日期（Date，可依日、月、年分組）
    - 分組顯示時，需明確標示分組標題（如：司機姓名、公司名稱、日期等）。
    - 每個分組下，顯示該分組條件下的所有託運單明細。
    - 分組區塊可支援展開/收合（Collapse/Expand）功能。
    - 分組後，仍需保留原有的篩選、查詢功能（如：可在分組下再依託運單號查詢）。
    - 分組統計：每個分組可顯示該分組下的託運單數量、總運費等彙總資訊。

4. **操作限制與防呆**
    - 非 PENDING 狀態的託運單，前端禁用/隱藏「編輯」、「刪除」等操作。
    - 若用戶以 URL 直連進入不可編輯的託運單，前端需顯示「不可編輯」提示。
    - 批次操作時自動排除非 PENDING 狀態的託運單，並提示用戶。

---

# 貨運單管理（Waybill Management）功能規格

---

## 一、前端 Spec

### 主要功能

- 託運單列表顯示（可依日期、司機、公司篩選）
- 託運單新增、編輯、刪除
- 託運單表單欄位驗證（必填、格式）
- 公司、司機可即時新增
- 額外費用、裝卸地點支援多筆
- 顯示是否已開立發票
- 不檢查 waybillNumber 唯一性
- 託運單狀態管理（標記不需開發票、還原）

### 表單欄位

| 欄位             | 型別         | 必填 | 備註                               |
| ---------------- | ------------ | ---- | ---------------------------------- |
| id               | string(UUID) | Y    | 自動產生                           |
| waybillNumber    | string       | Y    | 可重複                             |
| date             | string(date) | Y    |                                    |
| item             | string       | Y    | 貨名                               |
| tonnage          | number       | Y    | 噸數                               |
| companyName      | string       | Y    | 可即時新增                         |
| companyId        | string       | N    | 對應公司資料                       |
| loadingLocations | array        | Y    | 多筆起訖地點                       |
| workingTime      | object       | Y    | {start, end}                       |
| fee              | number       | Y    |                                    |
| driverName       | string       | Y    | 可即時新增                         |
| driverId         | string       | N    | 對應司機資料                       |
| plateNumber      | string       | Y    |                                    |
| notes            | string       | N    | 備註                               |
| extraExpenses    | array        | N    | 多筆額外費用                       |
| status           | string       | Y    | PENDING/INVOICED/NO_INVOICE_NEEDED |

### 互動流程

- 新增/編輯時，id 若為空則自動產生 UUID
- 公司、司機可於表單即時新增
- 刪除時需二次確認
- 表單驗證：必填、數值、日期格式
- 不檢查 waybillNumber 唯一性
- 標記不需開發票、還原操作需二次確認

---

## 二、後端 Spec

### API 介面

- `GET /waybills`：查詢託運單（支援篩選條件）
- `POST /waybills`：新增託運單（id 由前端產生或後端產生皆可）
- `PUT /waybills/{id}`：更新託運單
- `DELETE /waybills/{id}`：刪除託運單
- `PUT /waybills/{id}/no-invoice`：標記貨運單為「不需開發票」
- `PUT /waybills/{id}/restore`：將「不需開發票」貨運單還原為「未開發票」

### 驗證邏輯

- id 必須為 UUID
- 必填欄位驗證（同前端）
- 不檢查 waybillNumber 唯一性
- 若有 companyId/driverId，需驗證對應資料存在
- 標記不需開發票時，驗證託運單狀態為 PENDING
- 還原時，驗證託運單狀態為 NO_INVOICE_NEEDED

### 回傳格式

- 成功：200/201 + 託運單物件
- 失敗：400/404/500 + 錯誤訊息

---

## 三、資料庫 Table 設計

### Table: waybill

| 欄位名稱           | 型別          | PK  | Not Null | Default           | 說明                               |
| ------------------ | ------------- | --- | -------- | ----------------- | ---------------------------------- |
| id                 | UUID          | Y   | Y        | gen_random_uuid() | 主鍵                               |
| waybill_number     | VARCHAR(50)   | N   | Y        |                   | 託運單號                           |
| date               | DATE          | N   | Y        |                   |                                    |
| item               | VARCHAR(100)  | N   | Y        |                   | 貨名                               |
| tonnage            | NUMERIC(8,2)  | N   | Y        |                   | 噸數                               |
| company_name       | VARCHAR(100)  | N   | Y        |                   | 公司名稱                           |
| company_id         | UUID          | N   | N        |                   | 公司ID                             |
| working_time_start | TIME          | N   | Y        |                   |                                    |
| working_time_end   | TIME          | N   | Y        |                   |                                    |
| fee                | NUMERIC(12,2) | N   | Y        |                   |                                    |
| driver_name        | VARCHAR(100)  | N   | Y        |                   |                                    |
| driver_id          | UUID          | N   | N        |                   |                                    |
| plate_number       | VARCHAR(10)   | N   | Y        |                   |                                    |
| notes              | TEXT          | N   | N        |                   |                                    |
| status             | VARCHAR(20)   | N   | Y        | 'PENDING'         | PENDING/INVOICED/NO_INVOICE_NEEDED |
| created_at         | TIMESTAMP     | N   | Y        | now()             |                                    |
| updated_at         | TIMESTAMP     | N   | Y        | now()             |                                    |

#### Table: waybill_loading_location

| 欄位名稱   | 型別         | PK  | Not Null | Default | 說明        |
| ---------- | ------------ | --- | -------- | ------- | ----------- |
| id         | UUID         | Y   | Y        |         | 主鍵        |
| waybill_id | UUID         | N   | Y        |         | FK: waybill |
| from_loc   | VARCHAR(100) | N   | Y        |         | 起點        |
| to_loc     | VARCHAR(100) | N   | Y        |         | 終點        |

#### Table: waybill_extra_expense

| 欄位名稱   | 型別          | PK  | Not Null | Default | 說明        |
| ---------- | ------------- | --- | -------- | ------- | ----------- |
| id         | UUID          | Y   | Y        |         | 主鍵        |
| waybill_id | UUID          | N   | Y        |         | FK: waybill |
| item       | VARCHAR(100)  | N   | Y        |         | 費用項目    |
| fee        | NUMERIC(12,2) | N   | Y        |         | 費用        |
| notes      | TEXT          | N   | N        |         | 備註        |

---

## 四、託運單狀態規範

| 狀態值              | 說明                             | 與 Invoice 的關聯/對映              |
| ------------------- | -------------------------------- | ----------------------------------- |
| `PENDING`           | 尚未開立發票，且可編輯、刪除     | 在 `invoice_waybill` 中沒有對應紀錄 |
| `INVOICED`          | 已開立發票，且不可再編輯、刪除   | 在 `invoice_waybill` 中有關聯紀錄   |
| `NO_INVOICE_NEEDED` | 不需開立發票，且不可再編輯、刪除 | 在 `invoice_waybill` 中沒有對應紀錄 |

### 狀態流轉規則

1. **PENDING → INVOICED**  
   當此託運單被選入開立發票，且發票建立成功時，狀態自動轉為 `INVOICED`。
2. **PENDING → NO_INVOICE_NEEDED**  
   當使用者主動標記「不需開發票」時，狀態轉為 `NO_INVOICE_NEEDED`。
3. **INVOICED → PENDING**  
   當關聯的發票被「刪除」或「作廢」時，所有關聯的託運單自動還原為 `PENDING`。
4. **NO_INVOICE_NEEDED → PENDING**  
   當使用者還原「不需開發票」時，狀態轉為 `PENDING`。

### 與 Invoice 狀態的對映關係

- **Waybill.status = INVOICED**  
  該託運單的 ID 必須存在於 `invoice_waybill` 關聯表中，且對應的發票狀態為 `issued` 或 `paid`。
- **Waybill.status = PENDING**  
  該託運單的 ID 不存在於 `invoice_waybill` 關聯表中。
- **Waybill.status = NO_INVOICE_NEEDED**  
  該託運單的 ID 不存在於 `invoice_waybill` 關聯表中。

### 補充說明

- 只有 `PENDING` 狀態的託運單可被選取開立發票或標記為「不需開發票」。
- `INVOICED`、`NO_INVOICE_NEEDED` 狀態的託運單不可再編輯、刪除或被選入發票。
- 所有狀態流轉必須由後端 API 強制驗證，前端需同步 UI 禁用相關操作。

---

## 五、基礎資料管理 API

### 公司管理 API

- `GET /companies`：查詢公司列表
- `POST /companies`：新增公司
- `PUT /companies/{id}`：更新公司
- `DELETE /companies/{id}`：刪除公司

### 司機管理 API

- `GET /drivers`：查詢司機列表
- `POST /drivers`：新增司機
- `PUT /drivers/{id}`：更新司機
- `DELETE /drivers/{id}`：刪除司機

### 說明

- 這些 API 提供給 Waybill 和 Invoice 模組共用
- 支援即時新增功能，確保資料同步
- 新增時返回完整的資料物件供前端使用

---

> 本規格文件如有異動，請同步更新前後端與資料庫設計。
