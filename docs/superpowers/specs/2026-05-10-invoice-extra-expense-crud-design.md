# 開立發票時額外費用 CRUD 與金額重構設計

- **建立日期**：2026-05-10
- **影響範圍**：`InvoiceDialog`、`Waybill` API、後端 `WaybillController`
- **關聯檔案**：
  - 前端：[hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx](../../../hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx)
  - 後端：[hao-yang-finance-api/Controllers/WaybillController.cs](../../../hao-yang-finance-api/Controllers/WaybillController.cs)、[hao-yang-finance-api/Controllers/InvoiceController.cs](../../../hao-yang-finance-api/Controllers/InvoiceController.cs)

## 1. 背景與目標

目前 `InvoiceDialog` 在開立發票時，使用者只能勾選或取消既有的額外費用，無法新增、修改、刪除。同時計算邏輯有幾個問題：

1. **計算 bug**：`calculateExtraExpenseAmount()` 加總**所有**託運單上的額外費用，不論是否被勾選
2. **稅率開關失效**：「額外費用包含稅率」勾選後沒有任何效果（相關程式碼被註解掉）
3. **缺少總計視圖**：沒有「發票區金額 + 額外費用區金額」的合併總計

本設計要解決下列 4 項需求：

| 需求 | 對應設計章節 |
|---|---|
| 開立發票時可新增、修改、刪除額外費用項目 | §3、§4、§6 |
| 額外費用勾選與否要同步到計算 | §5 |
| 「額外費用包含稅率」勾選時要在額外費用區同步反映 | §5 |
| 新增「總金額總計」=（發票區總計 + 額外費用區總計） | §5、§6 |

## 2. 設計決策摘要

| # | 決策點 | 選擇 | 理由 |
|---|---|---|---|
| 1 | CRUD 作用範圍 | 修改原託運單的額外費用（永久性） | 額外費用本質屬於託運單；資料模型最單純 |
| 2 | 稅金顯示方式 | 兩個區塊各自算各自的稅 | 資訊獨立、不需腦中互推 |
| 3 | 新增 UI 位置 | 每張託運單區塊各有自己的「+ 新增」 | 歸屬最清楚 |
| 4 | 持久化時機 | 即時存（每次操作就打 API） | 使用者選擇 |
| 5 | 後端策略 | 新增額外費用專屬 CRUD endpoints | 避免 PUT waybill 砍掉重建造成 ID 失效 |

## 3. 後端 API 設計

新增 3 個 endpoint，放在 `WaybillController`，沿用既有權限 `[RequirePermission(Permission.WaybillUpdate)]`。

**路由風格**：`POST` 嵌套於 `waybills/{id}` 之下（建立時必須指定父資源）；`PUT` `DELETE` 平鋪於 `extra-expenses/{id}`（已有 ID 即可定位）。這是常見 REST 慣例。

### 3.1 `POST /waybills/{waybillId}/extra-expenses`

**Request Body**
```json
{
  "item": "過路費",
  "fee": 500,
  "notes": "ETC"
}
```

**Response 200**
```json
{
  "id": "uuid-生成的-新id",
  "item": "過路費",
  "fee": 500,
  "notes": "ETC"
}
```

**驗證**
- 託運單存在 → 否則 404
- 託運單 `status != 'INVOICED'` → 否則 400「已開立發票的託運單無法新增額外費用」
- `item` 非空、`fee` 為合法數字（**可為負數、可為 0**）

### 3.2 `PUT /extra-expenses/{id}`

**Request Body**
```json
{ "item": "過路費", "fee": 500, "notes": "ETC" }
```

**Response 200**：更新後完整的 `ExtraExpenseDto`

**驗證**
- 額外費用存在 → 否則 404
- 所屬託運單 `status != 'INVOICED'` → 否則 400「已開立發票的託運單無法修改額外費用」
- 同 §3.1 的欄位驗證

### 3.3 `DELETE /extra-expenses/{id}`

**Response 204**

**驗證**
- 額外費用存在 → 否則 404
- 所屬託運單 `status != 'INVOICED'` → 否則 400
- 額外費用未被任何 `Invoice` 透過 `InvoiceExtraExpense` 引用 → 否則 409「此額外費用已被發票引用，無法刪除」

### 3.4 不需要 Migration

`ExtraExpense` model 已存在，本設計只新增 endpoint。

## 4. 前端資料流與 state 管理

### 4.1 資料來源改造

目前 `InvoiceDialog` 直接從 prop `waybillList` 讀 `waybill.extraExpenses`。`waybillList` 由父層（`FinancePage`）從 `useWaybillsQuery` 衍生後傳入。

**目標**：CRUD 操作後，對話框內的額外費用清單要自動同步。

**實作方向**（擇一即可，由實作階段決定）：

- **A. 沿用現有資料流（推薦）**：mutation `onSuccess` 時 `invalidateQueries(['waybills'])` → 父層 `useWaybillsQuery` refetch → 重新計算 `waybillList` → 透過 prop 更新傳入對話框。前提是父層 `waybillList` 是從 query data 衍生（非獨立 local state）；若是 local state 則需父層提供 update callback
- **B. 對話框內獨立 query**：新增 `useWaybillsByIdsQuery(ids)`，對話框直接 subscribe；mutation invalidate 該 query。獨立性最好，但需新增 GET endpoint（或前端 filter 既有列表）

無論選哪個，mutation `onSuccess`／`onError` 的行為一致（見 §4.2）。

### 4.2 新增 mutation hooks

放在 [hao-yang-finance-app/src/features/Waybill/api/mutation.ts](../../../hao-yang-finance-app/src/features/Waybill/api/mutation.ts)：

```ts
useCreateExtraExpenseMutation()   // POST /waybills/{id}/extra-expenses
useUpdateExtraExpenseMutation()   // PUT  /extra-expenses/{id}
useDeleteExtraExpenseMutation()   // DELETE /extra-expenses/{id}
```

每個 mutation 的 `onSuccess`：
- invalidate `['waybills']`
- 呼叫 `notifySuccess('已新增/已更新/已刪除額外費用')`

每個 mutation 的 `onError`：
- 呼叫 `notifyError(error)`（`useNotifications` 自動解析後端 `{ message }` 格式）

### 4.3 對話框 state

**保留**
- `selectedExtraExpenses: string[]`
- `selectedSuggestedIds: string[]`

**新增**
- `editingExpenseId: string | null` — 目前正在編輯的那筆 ID（控制 inline 編輯）
- `addingForWaybillId: string | null` — 目前正在新增中的那張託運單 ID（控制新增列）

**ID 同步規則**
- 新增成功 → 把回傳的新 ID **自動加入** `selectedExtraExpenses`（合理預設）
- 刪除成功 → 從 `selectedExtraExpenses` 移除
- 編輯成功 → ID 不變，不需要動 `selectedExtraExpenses`

## 5. 金額計算邏輯

### 5.1 變數定義

| 變數 | 意義 |
|---|---|
| `T` | 稅率（`watchedValues.taxRate`，預設 0.05） |
| `IncTax` | 「額外費用包含稅率」開關 |
| `selectedWaybillFee` | 當前勾選的託運單（含建議託運單）`fee` 加總 |
| `selectedExtraExpenseFee` | **僅被勾選的**額外費用 `fee` 加總（修現有 bug） |

### 5.2 發票金額計算區

```
託運單金額 = selectedWaybillFee
稅金       = round(selectedWaybillFee × T)
總計       = 託運單金額 + 稅金
```
**不受 `IncTax` 影響**——永遠對託運單金額課稅。

### 5.3 額外費用計算區

```
額外費用金額 = selectedExtraExpenseFee
稅金        = IncTax ? round(selectedExtraExpenseFee × T) : 0
總計        = 額外費用金額 + 稅金
```

**只在 `IncTax = true` 時顯示「稅金」那一行**，避免 `$0` 雜訊。

明細列表**只顯示已勾選的**（修現有 bug）。

### 5.4 總金額總計區（新增）

```
發票區總計     = 5.2 的總計
額外費用區總計 = 5.3 的總計
總金額總計     = 發票區總計 + 額外費用區總計
```

### 5.5 數字捨入

所有顯示金額一律 `Math.round` 到整數。負數的稅金沿用 JS `Math.round` 標準行為（向上捨入），業務上可接受。

### 5.6 與後端資料庫的對應

後端 `Invoice` 表的 `subtotal / tax / total` 欄位語意保留現況（[InvoiceController.cs:317-330](../../../hao-yang-finance-api/Controllers/InvoiceController.cs#L317-L330)）：

- `subtotal` = waybillAmount + extraExpenseAmount
- `tax` = `IncTax ? (waybill+extra) × T : waybill × T`
- `total` = subtotal + tax

數學上 `total` 永遠等於前端的「總金額總計」，**後端計算不需修改**。前端兩個區塊只是 `total` 的拆解視圖。

### 5.7 範例驗算（稅率 5%、託運單 10000、勾選額外費用 2000）

**Case 1：`IncTax = false`**

| | 發票區 | 額外費用區 | 總計 |
|---|---|---|---|
| 金額 | 10000 | 2000 | — |
| 稅金 | 500 | （不顯示） | — |
| 總計 | 10500 | 2000 | **12500** |

後端：subtotal=12000、tax=500、total=**12500** ✓

**Case 2：`IncTax = true`**

| | 發票區 | 額外費用區 | 總計 |
|---|---|---|---|
| 金額 | 10000 | 2000 | — |
| 稅金 | 500 | 100 | — |
| 總計 | 10500 | 2100 | **12600** |

後端：subtotal=12000、tax=600、total=**12600** ✓

### 5.8 實作位置

重寫 `InvoiceDialog` 的 `calculateAmounts()` / `calculateExtraExpenseAmount()`，合併成一個 `useMemo` 計算 7 個值：
`waybillAmount, waybillTax, waybillTotal, extraExpenseAmount, extraExpenseTax, extraExpenseTotal, grandTotal`。

## 6. UI 版面

### 6.1 「額外費用」區塊改造（原「額外費用選擇」）

按託運單分組，每張託運單區塊內列表化：

```
┌─ 額外費用 ────────────────────────────────────────┐
│                                                    │
│ ○○公司 散裝水泥 的額外費用:                       │
│   ☑ 過路費      $500   [✏️] [🗑️]                 │
│   ☑ 油資        $300   [✏️] [🗑️]                 │
│   ☐ 規費       -$100   [✏️] [🗑️]                 │
│   [+ 新增額外費用]                                 │
│                                                    │
│ ○○公司 散裝水泥（第二張）的額外費用:              │
│   ☑ 過路費      $200   [✏️] [🗑️]                 │
│   [+ 新增額外費用]                                 │
└────────────────────────────────────────────────────┘
```

#### 編輯／新增：inline 編輯

按 `[✏️]` 或 `[+ 新增]` → 該列展開成輸入欄：
```
[品項輸入框] [金額輸入框] [備註輸入框] [✓ 儲存] [✗ 取消]
```

- 同時只能編輯／新增**一列**（用 `editingExpenseId` / `addingForWaybillId` 互斥）
- 第二次點 `[✏️]` 時自動 cancel 第一筆
- mutation 進行中：`[✓ 儲存]` 改 spinner、按鈕 disable
- 已開過發票的託運單（`status = INVOICED`）：整區隱藏 `[+ 新增]` `[✏️]` `[🗑️]`，只剩勾選框（與後端驗證對應）

### 6.2 「額外費用計算」區塊（修改）

```
┌─ 額外費用計算 ────────────────────────────────────┐
│ 過路費:                              $500         │
│ 油資:                                $300         │
│ 過路費:                              $200         │
│ ─────────────────────────────────────────────────  │
│ 小計:                              $1,000         │
│ 稅金 (5%):                            $50         │ ← 只在 IncTax=true 時顯示
│ ─────────────────────────────────────────────────  │
│ 總計:                              $1,050         │
└────────────────────────────────────────────────────┘
```
**明細只顯示已勾選的**。

### 6.3 「總金額總計」區塊（新增）

放在「額外費用計算」**正下方**，較粗的邊框與強調色：

```
┌═ 總金額總計 ══════════════════════════════════════┐
║  發票區總計:                       $10,500        ║
║  額外費用區總計:                    $1,050        ║
║  ════════════════════════════════════════════════  ║
║  總金額總計:                       $11,550        ║
└════════════════════════════════════════════════════┘
```

### 6.4 對話框區塊順序（從上到下）

1. 基本資訊（發票號碼、日期）
2. 公司選擇 + 公司資訊
3. 稅率設定 + 「額外費用包含稅率」開關
4. 備註
5. — Divider —
6. **發票金額計算**
7. **額外費用計算**
8. **總金額總計** ← 新增
9. 選中的託運單清單
10. 建議的託運單清單（如有）
11. **額外費用** ← 改造後的 CRUD 區塊（從原「額外費用選擇」改名）

## 7. 錯誤處理與邊界情況

| 情境 | 行為 |
|---|---|
| 編輯模式下對該發票引用的額外費用按 `[🗑️]` | 後端回 409 → snackbar「此額外費用已被發票引用，無法刪除」 |
| 對 INVOICED 託運單嘗試新增/修改/刪除 | 前端先擋（隱藏按鈕）；若仍觸發後端回 400 → snackbar 提示 |
| 同時開兩個編輯列 | 互斥；第二次點 `[✏️]` 自動 cancel 第一筆 |
| 使用者新增額外費用後直接關閉對話框 | 該筆已存在於託運單上（即時存的特性） |
| 刪除已勾選的額外費用 | 從 `selectedExtraExpenses` 移除；計算自動更新 |
| 編輯到一半按 `[✗ 取消]` | 收起編輯列、不送 API、欄位捨棄 |
| 金額空白／非數字 | `[✓ 儲存]` disable，欄位下方顯示錯誤 |
| 品項空白 | `[✓ 儲存]` disable |

## 8. 手動驗證 Checklist

目前專案沒有自動化測試框架，列出手動驗證項目：

### 金額計算

- [ ] 託運單 10000、勾選額外費用 2000、稅率 5%、IncTax=false → 發票區 10500、額外費用區 2000、總計 12500
- [ ] 同上但 IncTax=true → 發票區 10500、額外費用區 2100、總計 12600
- [ ] 取消勾選某筆額外費用 → 該筆從計算區明細消失、總計同步
- [ ] 額外費用為負數 -100 → 加總、稅金正確（負稅金）
- [ ] 後端 invoice 寫入後 `total` 欄位等於前端顯示的「總金額總計」

### CRUD

- [ ] 新增一筆 → 出現在列表、預設勾選、即時反映在計算區
- [ ] 編輯金額 → 計算區即時更新
- [ ] 刪除一筆 → 從列表移除、從 `selectedExtraExpenses` 移除、計算區同步
- [ ] 對 INVOICED 狀態的託運單：`[+ 新增]` `[✏️]` `[🗑️]` 都被隱藏
- [ ] 刪除已被某發票引用的額外費用 → 顯示 409 錯誤

### UI 狀態

- [ ] mutation 進行中按鈕 disable + spinner
- [ ] 同時只有一筆能進入編輯/新增模式
- [ ] 取消編輯不送 API、欄位捨棄

## 9. 不在本次範圍

- 將後端 `Invoice.subtotal/tax/total` 欄位拆解儲存（目前 `total` 仍代表合併後總金額，前端只是視覺拆解）
- 「額外費用」獨立列表頁、跨託運單管理介面
- 自動化測試框架建置
