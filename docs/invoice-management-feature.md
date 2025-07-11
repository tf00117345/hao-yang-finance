# 發票管理功能說明

1. **發票開立與管理**

    - 使用者可從未開立發票的託運單中，選取同一公司（客戶）的多筆託運單，合併開立一張發票。
    - 開立發票時，需手動輸入發票編號（唯一）、日期、稅率（預設5%，可調整）、備註。
    - 發票金額由系統自動計算：
        - 小計 = 所有託運單金額 + 選定的額外費用
        - 稅額計算方式：
            - 若勾選「額外費用包含稅率」：稅額 = (所有託運單金額 + 選定的額外費用) × 稅率
            - 若未勾選「額外費用包含稅率」：稅額 = 所有託運單金額 × 稅率
        - 總計 = 小計 + 稅額
    - 開立發票時，每筆額外費用都有勾選框，使用者可選擇是否將該筆額外費用加入發票。
    - 發票建立後，所有關聯託運單自動標記為 INVOICED，且不可再編輯、刪除。

2. **發票狀態與付款追蹤**

    - 發票有三種狀態：已開立（issued）、已收款（paid）、已作廢（void）。
    - 可記錄付款方式與付款備註。
    - 可標記發票為已收款，並記錄收款時間。
    - 標記已收款時需要讓使用者選擇付款方式：現金、轉帳、票據。

3. **發票修改、刪除、作廢**

    - 發票可修改（僅限發票本身資料，不可異動已關聯的託運單）。
    - 發票可刪除或作廢，操作需二次確認。
    - 刪除/作廢發票時，所有關聯託運單自動還原為 PENDING，可再次編輯、刪除或開立發票。
    - 已收款的發票被作廢時，付款方式和付款備註資料會保留在資料庫中，但發票狀態變為 void。

4. **貨運單標記不需開發票與還原**

    - 使用者可將託運單標記為「不需開發票」，此時託運單不可再編輯、刪除或被選入發票。
    - 可將「不需開發票」的託運單還原為 PENDING，恢復可編輯、刪除、開立發票。

5. **列表與查詢**

    - 支援未開立發票的託運單列表、已開立發票的發票與託運單列表。
    - 支援依發票號碼、託運單號查詢與篩選。
    - **發票管理列表功能**：
        - 每一行發票都有操作按鈕，包含：作廢、標記已收款、刪除功能
        - 標記已收款時會彈出對話框，讓使用者選擇付款方式（現金、轉帳、票據）
        - 支援篩選功能：已收款、未收款、依公司篩選發票數據
        - 操作按鈕根據發票狀態動態顯示/隱藏

6. **操作限制與防呆**

    - 只有 PENDING 狀態的託運單可被選取開立發票或標記為「不需開發票」。
    - 非 PENDING 狀態的託運單不可再編輯、刪除或被選入發票。
    - 發票編號唯一性由後端檢查，前端收到錯誤訊息後即時提示。
    - 發票操作按鈕根據狀態動態顯示：
        - 已開立（issued）：顯示「標記已收款」、「作廢」、「刪除」按鈕
        - 已收款（paid）：顯示「作廢」、「刪除」按鈕
        - 已作廢（void）：顯示「刪除」按鈕

7. **資料一致性與交易安全**
    - 發票建立、刪除、作廢與託運單狀態異動必須為原子操作，確保資料一致性。
    - 所有狀態流轉必須由後端 API 強制驗證，前端需同步 UI 禁用相關操作。

---

# 發票管理（Invoice Management）功能規格

---

## 一、前端 Spec

### 主要功能

- 顯示未開立發票的貨運單列表（可多選、搜尋、篩選）
- 顯示已開立發票的貨運單與發票列表（可搜尋、篩選）
- 支援依貨運單號、發票號碼查詢
- **發票列表管理功能**：
    - 每筆發票列表項目包含操作按鈕（作廢、標記已收款、刪除）
    - 標記已收款對話框，包含付款方式選擇（現金、轉帳、票據）和備註輸入
    - 篩選功能：已收款、未收款、公司篩選
    - 操作按鈕根據發票狀態動態顯示
- 新增發票：
    - 選取同一公司（客戶）的多筆貨運單
    - 手動輸入發票編號（唯一）、日期、稅率、備註
    - 每筆額外費用提供勾選框，使用者可選擇是否加入發票
    - 提供「額外費用包含稅率」勾選框，影響稅額計算方式
    - 自動計算小計、稅額、總計
    - 綁定公司（單選）
- 修改發票：
    - 允許修改發票本身資料（編號、日期、稅率、備註）
    - 不允許異動已關聯的貨運單
- 刪除/作廢發票：
    - 需二次確認
    - 刪除/作廢後，所有關聯貨運單自動標記為「未開發票」
- 發票付款狀態追蹤（已開立/已收款）
- 付款方式固定選項（現金、轉帳、票據）

### 發票列表操作按鈕設計

| 發票狀態        | 可用操作按鈕           | 說明             |
| --------------- | ---------------------- | ---------------- |
| issued (已開立) | 標記已收款、作廢、刪除 | 所有操作皆可執行 |
| paid (已收款)   | 作廢、刪除             | 不可再標記已收款 |
| void (已作廢)   | 刪除                   | 僅可刪除         |

### 標記已收款對話框設計

- **標題**：標記發票已收款
- **內容**：
    - 發票編號（唯讀顯示）
    - 付款方式選擇（必選）：現金、轉帳、票據
    - 付款備註（可選）：多行文字輸入
    - 收款時間（自動填入當前時間，可調整）
- **操作按鈕**：確認、取消

### 篩選功能設計

- **收款狀態篩選**：
    - 全部
    - 已收款（paid）
    - 未收款（issued）
    - 已作廢（void）
- **公司篩選**：
    - 下拉選單，顯示所有有發票的公司
    - 支援搜尋功能
- **日期範圍篩選**：
    - 發票開立日期區間選擇

### 發票開立額外費用處理

- **額外費用選擇**：
    - 顯示所有關聯託運單的額外費用清單
    - 每筆額外費用提供勾選框，預設全部勾選
    - 使用者可取消勾選不需要加入發票的額外費用
- **稅率計算選項**：
    - 提供「額外費用包含稅率」勾選框
    - 勾選時：稅額 = (託運單金額 + 選定額外費用) × 稅率
    - 未勾選時：稅額 = 託運單金額 × 稅率
- **金額顯示**：
    - 即時顯示小計、稅額、總計
    - 當勾選狀態改變時，自動重新計算

### 互動流程

- 開立發票時，僅能選擇同一公司（客戶）的貨運單
- 發票編號唯一性由後端檢查，前端收到錯誤訊息後顯示提示
- 刪除/作廢發票皆需二次確認
- 標記已收款時需選擇付款方式，操作完成後發票狀態自動更新為 paid
- 篩選條件可複合使用，實時更新列表顯示

---

## 二、後端 Spec

### API 介面

- `GET /invoices`：查詢發票（支援條件搜尋、狀態篩選）
    - 查詢參數：
        - `status`: 發票狀態篩選（issued/paid/void）
        - `company_id`: 公司ID篩選
        - `date_from`: 開始日期
        - `date_to`: 結束日期
- `POST /invoices`：新增發票（檢查發票編號唯一性，計算金額）
    - 請求Body包含：
        - 基本發票資料
        - 關聯託運單IDs
        - 選定的額外費用IDs
        - 是否包含額外費用稅率
- `PUT /invoices/{id}`：修改發票（僅允許修改發票本身資料）
- `DELETE /invoices/{id}`：刪除發票（**物理刪除**，僅特定情況允許，自動同步貨運單狀態為 PENDING）
- `POST /invoices/{id}/void`：作廢發票（**邏輯刪除**，將發票狀態改為 `void`，自動同步貨運單狀態為 PENDING）
- `POST /invoices/{id}/mark-paid`：標記發票已收款
    - 請求Body：
        ```json
        {
        	"payment_method": "現金|轉帳|票據",
        	"payment_note": "付款備註（可選）",
        	"paid_at": "2024-01-01T10:00:00Z"
        }
        ```

### 驗證邏輯

- 發票編號唯一性檢查（後端）
- 發票僅能關聯建立時選定的貨運單，後續不可異動
- 刪除/作廢發票時，所有關聯貨運單自動標記為 `PENDING`
- 金額計算（小計、稅額、總計）由後端為主，需考慮額外費用稅率選項
- 標記已收款時驗證發票狀態為 `issued`
- 付款方式必須為有效選項（現金、轉帳、票據）
- 驗證選定的額外費用確實屬於關聯的託運單

### 回傳格式

- 成功：200/201 + 發票/貨運單物件
- 失敗：400/404/500 + 錯誤訊息

---

## 三、資料庫 Table 設計

### Table: invoice

| 欄位名稱                   | 型別          | PK  | Not Null | Default           | 說明                                     |
| -------------------------- | ------------- | --- | -------- | ----------------- | ---------------------------------------- |
| id                         | UUID          | Y   | Y        | gen_random_uuid() | 主鍵                                     |
| invoice_number             | VARCHAR(50)   | N   | Y        |                   | 發票編號（唯一）                         |
| date                       | DATE          | N   | Y        |                   | 發票開立日期                             |
| company_id                 | UUID          | N   | Y        |                   | 公司ID                                   |
| company_name               | VARCHAR(100)  | N   | Y        |                   | 公司名稱（冗餘欄位，儲存開立當下的名稱） |
| subtotal                   | NUMERIC(12,2) | N   | Y        |                   | 小計                                     |
| tax_rate                   | NUMERIC(5,4)  | N   | Y        | 0.05              | 稅率                                     |
| extra_expenses_include_tax | BOOLEAN       | N   | Y        | false             | 額外費用是否包含稅率                     |
| tax                        | NUMERIC(12,2) | N   | Y        |                   | 稅額                                     |
| total                      | NUMERIC(12,2) | N   | Y        |                   | 總計                                     |
| status                     | VARCHAR(10)   | N   | Y        |                   | issued/paid/void                         |
| payment_method             | VARCHAR(20)   | N   | N        |                   | 付款方式（現金/轉帳/票據）               |
| payment_note               | TEXT          | N   | N        |                   | 付款備註                                 |
| notes                      | TEXT          | N   | N        |                   | 發票備註                                 |
| created_at                 | TIMESTAMP     | N   | Y        | now()             | 建立時間                                 |
| updated_at                 | TIMESTAMP     | N   | Y        | now()             | 更新時間                                 |
| paid_at                    | TIMESTAMP     | N   | N        |                   | 收款時間                                 |

### Table: invoice_waybill (發票與貨運單關聯表)

| 欄位名稱   | 型別 | PK  | Not Null | Default | 說明        |
| ---------- | ---- | --- | -------- | ------- | ----------- |
| id         | UUID | Y   | Y        |         | 主鍵        |
| invoice_id | UUID | N   | Y        |         | FK: invoice |
| waybill_id | UUID | N   | Y        |         | FK: waybill |

### Table: invoice_extra_expense (發票包含的額外費用)

| 欄位名稱         | 型別 | PK  | Not Null | Default | 說明                      |
| ---------------- | ---- | --- | -------- | ------- | ------------------------- |
| id               | UUID | Y   | Y        |         | 主鍵                      |
| invoice_id       | UUID | N   | Y        |         | FK: invoice               |
| waybill_extra_id | UUID | N   | Y        |         | FK: waybill_extra_expense |

### Table: waybill（補充）

| 欄位名稱 | 型別        | PK  | Not Null | Default           | 說明                               |
| -------- | ----------- | --- | -------- | ----------------- | ---------------------------------- |
| id       | UUID        | Y   | Y        | gen_random_uuid() | 主鍵                               |
| ...      | ...         |     |          |                   | 其他欄位略                         |
| status   | VARCHAR(20) | N   | Y        | 'PENDING'         | PENDING/INVOICED/NO_INVOICE_NEEDED |

---

## 四、託運單狀態與發票狀態對映

| Waybill 狀態        | 說明                           | 關聯                                |
| ------------------- | ------------------------------ | ----------------------------------- |
| `PENDING`           | 尚未開立發票，可編輯、刪除     | 在 `invoice_waybill` 中沒有對應紀錄 |
| `INVOICED`          | 已開立發票，不可再編輯、刪除   | 在 `invoice_waybill` 中有關聯紀錄   |
| `NO_INVOICE_NEEDED` | 不需開立發票，不可再編輯、刪除 | 在 `invoice_waybill` 中沒有對應紀錄 |

### 狀態流轉規則

- `PENDING` → `INVOICED`：開立發票成功時，狀態轉為 `INVOICED`，並在 `invoice_waybill` 建立關聯。
- `PENDING` → `NO_INVOICE_NEEDED`：標記不需開發票時，狀態轉為 `NO_INVOICE_NEEDED`。
- `INVOICED` → `PENDING`：發票被刪除或作廢時，所有關聯託運單自動還原為 `PENDING`，並刪除 `invoice_waybill` 中的關聯。
- `NO_INVOICE_NEEDED` → `PENDING`：還原時，狀態轉為 `PENDING`。

### 發票狀態流轉規則

- `issued` → `paid`：標記已收款時，狀態轉為 `paid`，並記錄付款方式、備註、收款時間。
- `issued` → `void`：作廢發票時，狀態轉為 `void`，關聯託運單自動還原為 `PENDING`。
- `paid` → `void`：已收款發票仍可作廢，狀態轉為 `void`，關聯託運單自動還原為 `PENDING`，付款資料保留。

### 補充說明

- 只有 `PENDING` 狀態的託運單可被選取開立發票或標記為「不需開發票」。
- `INVOICED`、`NO_INVOICE_NEEDED` 狀態的託運單不可再編輯、刪除或被選入發票。
- Invoice 狀態 `issued` 或 `paid` 時，所有關聯的 Waybill 狀態都應為 `INVOICED`。
- Invoice 被刪除或作廢時，所有關聯的 Waybill 狀態自動還原為 `PENDING`。
- 發票列表操作按鈕根據狀態動態顯示，確保操作的合理性。
- 已收款發票被作廢時，付款方式和付款備註等資料會保留在資料庫中，以供審計追蹤。

---

## 五、前端組件設計建議

### InvoiceActionsButton 組件

```typescript
interface InvoiceActionsButtonProps {
	invoice: Invoice;
	onMarkPaid: (invoiceId: string, paymentData: PaymentData) => void;
	onVoid: (invoiceId: string) => void;
	onDelete: (invoiceId: string) => void;
}

interface PaymentData {
	paymentMethod: '現金' | '轉帳' | '票據';
	paymentNote?: string;
	paidAt: string;
}
```

### PaymentDialog 組件

```typescript
interface PaymentDialogProps {
	open: boolean;
	invoice: Invoice;
	onClose: () => void;
	onConfirm: (paymentData: PaymentData) => void;
}
```

### InvoiceFilters 組件

```typescript
interface InvoiceFiltersProps {
	filters: {
		status?: 'issued' | 'paid' | 'void';
		companyId?: string;
		dateFrom?: string;
		dateTo?: string;
	};
	onFiltersChange: (filters: InvoiceFilters) => void;
}
```

### InvoiceForm 組件

```typescript
interface InvoiceFormProps {
	waybills: Waybill[];
	onSubmit: (invoiceData: InvoiceFormData) => void;
}

interface InvoiceFormData {
	invoiceNumber: string;
	date: string;
	taxRate: number;
	extraExpensesIncludeTax: boolean;
	selectedExtraExpenses: string[]; // 選定的額外費用IDs
	notes?: string;
}
```

---

> 本規格文件如有異動，請同步更新前後端與資料庫設計。
