# 🚛 司機結算表功能需求規格 (Revised Specification)

## 功能名稱

司機結算表 (Driver Settlement)

---

## 主要用途

此頁面提供司機查閱當月 **分紅獎金與實際可領薪資**。
計算方式如下：

1. **收入 (Income)**

   * **發票收入** = 來自託運單 (`waybill.status = INVOICED`) 的 `fee` 總和
   * **現金收入** = 來自託運單 (`waybill.status = NO_INVOICE_NEEDED`) 的 `fee` 總和
   * **收入總額 = 發票收入 + 現金收入**

2. **公司支出 (Company Expenses)**

   * 預設項目 (自動生成，可修改/刪除)：

     * 稅金 = 收入 × 0.05
     * 記帳費 = 5000
     * 回郵信封 = 1000
     * 靠行費 = 1500
     * 補助電話入關 = 1500
     * 停車費 = 預設空白，由使用者輸入
     * 加油 = 預設空白，由使用者輸入
     * 薪資 = 預設空白，由使用者輸入
   * 使用者可新增/修改/刪除額外公司支出項目
   * **在 expenses 中保存「當下快照數值」**，避免日後稅率或規則變更造成歷史數據不一致

3. **個人支出 (Personal Expenses)**

   * 完全由使用者新增/修改/刪除
   * 自動納入分紅計算

4. **分紅計算公式**

   ```
   分紅獎金 = (收入總額 - 公司支出總額 - 個人支出總額) × 分紅百分比
   ```

5. **最終可領金額公式**

   ```
   可領金額 = 分紅獎金 + 個人支出總額 - 現金收入
   ```

   （現金收入已先被司機領走，所以需扣除）

---

## 功能需求細項

### 1. 查詢與顯示

* 可查詢指定月份
* 顯示當月收入（發票收入 + 現金收入）
* 顯示公司支出項目（預設+自訂）
* 顯示個人支出項目
* 即時計算分紅獎金與可領金額
* 頁面樣式採「結算表格」風格，符合會計背景使用者習慣

### 2. 編輯功能

* **公司支出**

  * 預設項目自動生成
  * 使用者可修改數值、新增/刪除項目
* **個人支出**

  * 完全由使用者自由新增/修改/刪除

### 3. 輸入與輸出

* 輸入：指定月份、分紅百分比、各支出金額
* 輸出：

  * 收入總額
  * 公司支出總額
  * 個人支出總額
  * 分紅獎金
  * 最終可領金額

### 4. 匯出功能

* 提供 PDF 匯出，樣式與頁面一致
* 報表內容：

  * 司機姓名 / 編號
  * 月份
  * 收入明細
  * 公司支出明細
  * 個人支出明細
  * 分紅計算過程（含百分比）
  * 最終可領金額
* PDF 樣式正式、可列印存檔

---

## SQL Schema 設計

```sql
-- 支出項目類型 (可擴充)
CREATE TABLE expense_types (
    expense_type_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('company', 'personal')),
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    default_amount NUMERIC(12,2),
    formula TEXT, -- 例如 "income * 0.05"
    created_at TIMESTAMP DEFAULT NOW()
);

-- 月度結算 (包含分紅比率 & 計算結果)
CREATE TABLE driver_settlements (
    settlement_id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    target_month DATE NOT NULL, -- yyyy-mm-01
    income NUMERIC(12,2) NOT NULL DEFAULT 0,
    income_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_company_expense NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_personal_expense NUMERIC(12,2) NOT NULL DEFAULT 0,
    profit_share_ratio NUMERIC(5,2) NOT NULL, -- e.g. 30 = 30%
    bonus NUMERIC(12,2) NOT NULL DEFAULT 0, -- 分紅獎金
    final_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- 可領金額
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (driver_id, target_month)
);

-- 實際支出項目（每月，與結算單關聯）
CREATE TABLE expenses (
    expense_id BIGSERIAL PRIMARY KEY,
    settlement_id BIGINT NOT NULL REFERENCES driver_settlements(settlement_id) ON DELETE CASCADE,
    driver_id BIGINT NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    expense_type_id INT REFERENCES expense_types(expense_type_id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL, -- 可覆寫 expense_types.name
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), -- 當下快照數值
    category VARCHAR(50) NOT NULL CHECK (category IN ('company', 'personal')),
    target_month DATE NOT NULL, -- yyyy-mm-01
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 系統流程簡述

1. 使用者選擇月份 & 分紅比率
2. 系統查詢該月份司機的 **waybill 收入**（區分發票收入與現金收入）
3. 系統自動生成 **公司支出預設項目**
4. 使用者可輸入 / 調整公司支出與個人支出
5. 系統計算：

   * 收入總額
   * 公司支出總額
   * 個人支出總額
   * 分紅獎金
   * 最終可領金額
6. 儲存結果至 `driver_settlements` + `expenses`
7. 可匯出 PDF 報表