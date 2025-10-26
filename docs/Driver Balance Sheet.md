## 功能需求規格 (Specification)

### 功能名稱

司機資產負債表頁面 (Driver Balance Sheet)

### 主要用途

此頁面提供司機查閱當月 **分紅獎金與實際可領薪資**。
計算方式為：

1. **收入 (Income)** = 所有屬於司機的託運單 (waybill，driverId 為該司機) 的 `fee` 總和。
2. **公司支出 (Company Expenses)** = 固定預設項目 (可修改/刪除/新增) + 使用者自訂項目。

   - 固定預設項目：

     - 稅金 = 收入 × 0.05
     - 記帳費 = 5000
     - 回郵信封 = 1000
     - 靠行費 = 1500
     - 補助電話入關 = 1500
     - 停車費 = 預設空白，使用者輸入
     - 加油 = 預設空白，使用者輸入
     - 薪資 = 預設空白，使用者輸入

   - 使用者可 **新增 / 修改 / 刪除** 公司支出項目。

3. **個人支出 (Personal Expenses)** = 使用者自由新增/修改/刪除的項目。
4. **分紅計算**：

   ```
   分紅獎金 = (收入 - 公司支出 - 個人支出) × 分紅百分比
   ```

   (分紅百分比由後端設定或使用者輸入)

5. **最終可領金額**：

   ```
   可領金額 = 分紅獎金 + 個人支出 - 現金收入
   ```

   （註：現金收入是司機已先收取的金額，需從應領薪資中扣除）

---

### 功能需求細項

1. **查詢與顯示**

   - 以司機為主顯示此司機單月的資產負債表
   - 查詢指定月份的 waybill 紀錄，計算收入總額。
   - 顯示公司支出項目，預設值自動帶入，允許修改。
   - 顯示個人支出項目，允許新增/修改/刪除。
   - 即時計算分紅獎金與最終可領金額。
   - 請發揮創意請把頁面設計成資產負債表的樣式。使用者是會計背景出生。

2. **編輯功能**

   - 公司支出：

     - 預設項目自動生成。
     - 每個項目可修改數值。
     - 使用者可新增/刪除額外項目。

   - 個人支出：

     - 完全由使用者自由新增/修改/刪除。

3. **計算與邏輯**

   - 收入 = waybill.fee(driverId = 當前司機) 的總和（區分為發票收入與現金收入）。
   - 稅金 = 發票收入 × 0.05 (自動計算並更新)。
   - 分紅獎金 = (總收入 - 公司支出總額 - 個人支出總額) × 分紅百分比。
   - 可領金額 = 分紅獎金 + 個人支出總額 - 現金收入。

4. **輸入與輸出**

   - 輸入：

     - 指定月份 (必填)
     - 分紅百分比 (必填，後端提供或由使用者輸入)
     - 各項支出金額 (使用者可調整)

   - 輸出：

     - 收入總額
     - 公司支出總額
     - 個人支出總額
     - 分紅獎金
     - 最終可領金額

5. **匯出功能**

   - 提供 PDF 匯出功能，生成與頁面一致的「資產負債表報表」。
   - PDF 報表需包含：

     - 司機姓名 / 編號
     - 月份
     - 收入、公司支出明細、個人支出明細
     - 分紅計算過程與分紅百分比
     - 最終可領金額

   - PDF 格式需為正式報表樣式，方便列印與存檔。

---

### 預期用途

- 讓司機清楚了解 **本月收入、公司代扣項目、個人支出、分紅計算**。
- 提供管理者與司機一個透明的結算方式，避免爭議。
- 作為薪酬發放與獎金結算的依據。

---

-- 支出項目類型 (可擴充)
CREATE TABLE expense_types (
expense_type_id SERIAL PRIMARY KEY,
category VARCHAR(50) NOT NULL CHECK (category IN ('company', 'personal')),
name VARCHAR(100) NOT NULL,
is_default BOOLEAN DEFAULT FALSE,
default_amount NUMERIC(12,2),
formula TEXT, -- 可存公式，例如 "income \* 0.05"
created_at TIMESTAMP DEFAULT NOW()
);

-- 實際支出項目（每月）
CREATE TABLE expenses (
expense_id BIGSERIAL PRIMARY KEY,
driver_id BIGINT NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
expense_type_id INT REFERENCES expense_types(expense_type_id) ON DELETE SET NULL,
name VARCHAR(100) NOT NULL, -- 可以複寫 expense_types.name
amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
category VARCHAR(50) NOT NULL CHECK (category IN ('company', 'personal')),
target_month DATE NOT NULL, -- yyyy-mm-01 表示該月
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

-- 月度結算 (包含分紅比率 & 計算結果)
CREATE TABLE driver_settlements (
settlement_id BIGSERIAL PRIMARY KEY,
driver_id BIGINT NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
target_month DATE NOT NULL, -- yyyy-mm-01
income NUMERIC(12,2) NOT NULL DEFAULT 0,
total_company_expense NUMERIC(12,2) NOT NULL DEFAULT 0,
total_personal_expense NUMERIC(12,2) NOT NULL DEFAULT 0,
profit_share_ratio NUMERIC(5,2) NOT NULL, -- e.g. 30 = 30%
bonus NUMERIC(12,2) NOT NULL DEFAULT 0, -- 分紅獎金
final_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- 可領金額
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE (driver_id, target_month)
);
