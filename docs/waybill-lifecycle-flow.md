# 託運單生命週期流程圖

## 文件說明

本文件描述託運單（Waybill）從建立到最終狀態的完整生命週期，包括所有可能的決策點、狀態轉換路徑，以及與發票管理系統的整合流程。

---

## 一、生命週期概覽

託運單在系統中有 **4 種狀態**，從建立開始，根據業務需求和操作選擇，會經歷不同的狀態轉換路徑。

### 狀態定義

| 狀態                | 說明                           | 可編輯 | 可刪除 |
| ------------------- | ------------------------------ | ------ | ------ |
| `PENDING`           | 待處理，等待決定是否開發票     | ✅     | ✅     |
| `INVOICED`          | 已開立發票                     | ❌     | ❌     |
| `NO_INVOICE_NEEDED` | 不需開發票且已收款             | ❌     | ❌     |
| `PENDING_PAYMENT`   | 不需開發票但尚未收款（待收款） | ⚠️ 註  | ❌     |

**註**: `PENDING_PAYMENT` 狀態僅可編輯備註欄位，其他欄位不可修改。

---

## 二、完整流程圖

```mermaid
graph TD
    Start([建立託運單]) --> Create{建立時選擇}

    Create -->|一般建立| PENDING[PENDING<br/>待開發票]
    Create -->|勾選「不需開發票」| NO_INV[NO_INVOICE_NEEDED<br/>不需開發票]

    PENDING --> Decision1{決策點 1:<br/>如何處理此託運單?}

    Decision1 -->|選項 A:<br/>開立發票| Invoice[開立發票操作]
    Decision1 -->|選項 B:<br/>不需開發票<br/>且已收款| MarkNoInv[標記不需開發票]
    Decision1 -->|選項 C:<br/>不需開發票<br/>但尚未收款| MarkPending[標記待收款]
    Decision1 -->|選項 D:<br/>直接刪除| Delete1([刪除託運單])

    Invoice --> INVOICED[INVOICED<br/>已開發票]
    MarkNoInv --> NO_INV
    MarkPending --> PEND_PAY[PENDING_PAYMENT<br/>待收款]

    INVOICED --> InvoiceDecision{發票狀態變化}

    InvoiceDecision -->|發票被刪除| BackToPending1[還原]
    InvoiceDecision -->|發票被作廢| BackToPending2[還原]
    InvoiceDecision -->|發票被編輯<br/>移除此託運單| BackToPending3[還原]
    InvoiceDecision -->|發票保持有效| StayInvoiced[保持 INVOICED]

    BackToPending1 --> PENDING
    BackToPending2 --> PENDING
    BackToPending3 --> PENDING

    NO_INV --> Decision2{決策點 2:<br/>是否需要還原?}
    Decision2 -->|是，需要修改<br/>或重新開票| Restore1[執行還原操作]
    Decision2 -->|否，保持現狀| StayNoInv[保持 NO_INVOICE_NEEDED]

    Restore1 --> PENDING

    PEND_PAY --> Decision3{決策點 3:<br/>收款狀態}
    Decision3 -->|已收款| UpdateToNoInv[標記不需開發票]
    Decision3 -->|仍未收款| EditNotes[編輯備註<br/>記錄追蹤資訊]
    Decision3 -->|需要還原| Restore2[執行還原操作]

    UpdateToNoInv --> NO_INV
    EditNotes --> PEND_PAY
    Restore2 --> PENDING

    StayInvoiced --> End1([流程結束:<br/>已開發票])
    StayNoInv --> End2([流程結束:<br/>不需開發票])
    Delete1 --> End3([流程結束:<br/>已刪除])

    style Start fill:#e1f5ff
    style PENDING fill:#fff3cd
    style INVOICED fill:#d4edda
    style NO_INV fill:#e2e3e5
    style PEND_PAY fill:#f8d7da
    style End1 fill:#d4edda
    style End2 fill:#e2e3e5
    style End3 fill:#f8d7da
    style Decision1 fill:#fff3cd
    style Decision2 fill:#e2e3e5
    style Decision3 fill:#f8d7da
```

---

## 三、決策點詳細說明

### 決策點 0：建立託運單時

**時機**: 新增託運單

**選擇**:

1. **一般建立** → 初始狀態為 `PENDING`

   - 適用場景：大部分託運單，後續需要開立發票
   - API: `POST /api/waybill` (不勾選 `markAsNoInvoiceNeeded`)

2. **建立時標記不需開發票** → 初始狀態為 `NO_INVOICE_NEEDED`
   - 適用場景：明確知道不需開發票且已收現金
   - API: `POST /api/waybill` (勾選 `markAsNoInvoiceNeeded`)

---

### 決策點 1：PENDING 狀態的處理選擇

**時機**: 託運單處於 `PENDING` 狀態時

**選擇**:

#### 選項 A：開立發票

- **業務場景**: 客戶需要正式發票，用於公司報帳或稅務申報
- **操作**: 在發票管理頁面選取此託運單開立發票
- **API**: `POST /api/invoice` (包含此託運單 ID)
- **狀態變化**: `PENDING` → `INVOICED`
- **後續**: 託運單與發票綁定，無法單獨編輯或刪除

#### 選項 B：標記不需開發票（已收款）

- **業務場景**:
  - 客戶以現金支付且不需要發票
  - 小額交易，不需要正式發票
  - 已確認收到款項
- **操作**: 點擊「標記不需開發票」按鈕
- **API**: `PUT /api/waybill/{id}/no-invoice`
- **狀態變化**: `PENDING` → `NO_INVOICE_NEEDED`
- **後續**: 託運單標記為已完成，無需後續處理

#### 選項 C：標記待收款（未收款）

- **業務場景**:
  - 客戶欠款但不需要正式發票
  - 月結客戶，先記錄應收款項
  - 需要追蹤但不走發票流程
- **操作**: 點擊「標記待收款」按鈕
- **API**: `PUT /api/waybill/{id}/pending-payment`
- **狀態變化**: `PENDING` → `PENDING_PAYMENT`
- **可選操作**: 同時更新備註，記錄收款相關資訊
- **後續**: 可持續編輯備註追蹤收款進度

#### 選項 D：直接刪除

- **業務場景**:
  - 錄入錯誤，需要刪除重建
  - 業務取消，不需要此記錄
- **操作**: 點擊「刪除」按鈕並確認
- **API**: `DELETE /api/waybill/{id}`
- **狀態變化**: 託運單及關聯資料完全移除
- **限制**: 僅 `PENDING` 狀態可刪除

---

### 決策點 2：NO_INVOICE_NEEDED 狀態的處理

**時機**: 託運單處於 `NO_INVOICE_NEEDED` 狀態時

**選擇**:

#### 選項 A：保持現狀

- **業務場景**: 狀態正確，無需變更
- **操作**: 無需操作
- **結果**: 託運單保持 `NO_INVOICE_NEEDED` 狀態

#### 選項 B：還原為 PENDING

- **業務場景**:
  - 標記錯誤，實際需要開立發票
  - 客戶後續要求補開發票
  - 需要修改託運單資料
- **操作**: 點擊「還原」按鈕
- **API**: `PUT /api/waybill/{id}/restore`
- **狀態變化**: `NO_INVOICE_NEEDED` → `PENDING`
- **後續**: 恢復為可編輯狀態，可重新選擇處理方式

---

### 決策點 3：PENDING_PAYMENT 狀態的處理

**時機**: 託運單處於 `PENDING_PAYMENT` 狀態時

**選擇**:

#### 選項 A：已收款，標記為不需開發票

- **業務場景**: 客戶已付款，結案
- **操作**: 先還原為 `PENDING`，再標記為 `NO_INVOICE_NEEDED`
- **API 流程**:
  1. `PUT /api/waybill/{id}/restore` (還原)
  2. `PUT /api/waybill/{id}/no-invoice` (標記不需開發票)
- **狀態變化**: `PENDING_PAYMENT` → `PENDING` → `NO_INVOICE_NEEDED`

#### 選項 B：持續追蹤，編輯備註

- **業務場景**:
  - 客戶尚未付款，持續追蹤
  - 更新收款進度或備註資訊
- **操作**: 點擊「編輯備註」按鈕
- **API**: `PUT /api/waybill/{id}/update-notes`
- **狀態變化**: 保持 `PENDING_PAYMENT`
- **限制**: 僅能修改 `notes` 欄位

#### 選項 C：還原為 PENDING

- **業務場景**:
  - 客戶決定改為需要發票
  - 需要全面修改託運單資料
- **操作**: 點擊「還原」按鈕
- **API**: `PUT /api/waybill/{id}/restore`
- **狀態變化**: `PENDING_PAYMENT` → `PENDING`
- **後續**: 恢復完整編輯權限

---

### 發票系統觸發的狀態變化（自動）

**時機**: 發票相關操作觸發

#### 情境 A：發票被刪除

- **觸發**: 使用者刪除發票
- **API**: `DELETE /api/invoice/{id}`
- **自動處理**: 所有關聯的託運單
- **狀態變化**: `INVOICED` → `PENDING`
- **關聯處理**: 清除託運單的 `invoiceId`

#### 情境 B：發票被作廢

- **觸發**: 使用者作廢發票
- **API**: `POST /api/invoice/{id}/void`
- **自動處理**: 所有關聯的託運單
- **狀態變化**: `INVOICED` → `PENDING`
- **關聯處理**: 清除託運單的 `invoiceId`
- **註**: 發票資料保留（狀態變為 `void`），但託運單解除綁定

#### 情境 C：發票被編輯（移除此託運單）

- **觸發**: 使用者編輯發票，取消勾選此託運單
- **API**: `PUT /api/invoice/{id}`
- **自動處理**: 被移除的託運單
- **狀態變化**: `INVOICED` → `PENDING`
- **關聯處理**: 清除託運單的 `invoiceId`

#### 情境 D：發票被還原（僅針對作廢的發票）

- **觸發**: 使用者還原已作廢的發票
- **API**: `POST /api/invoice/{id}/restore`
- **自動處理**: 所有原本關聯的託運單
- **狀態變化**: `PENDING` → `INVOICED`
- **關聯處理**: 恢復託運單的 `invoiceId`

---

## 四、典型業務流程場景

### 場景 1：標準開票流程

```
創建託運單 (PENDING)
    ↓
客戶確認需要發票
    ↓
開立發票 (INVOICED)
    ↓
發票標記已收款 (發票 status: paid)
    ↓
流程結束
```

**API 調用順序**:

1. `POST /api/waybill` → 創建託運單
2. `POST /api/invoice` → 開立發票（託運單自動變為 INVOICED）
3. `POST /api/invoice/{id}/mark-paid` → 標記發票已收款

---

### 場景 2：現金交易流程

```
創建託運單 (PENDING)
    ↓
客戶現金支付，不需發票
    ↓
標記不需開發票 (NO_INVOICE_NEEDED)
    ↓
流程結束
```

**API 調用順序**:

1. `POST /api/waybill` → 創建託運單
2. `PUT /api/waybill/{id}/no-invoice` → 標記不需開發票

**快捷方式**:

- 創建時直接標記: `POST /api/waybill` (勾選 `markAsNoInvoiceNeeded`)

---

### 場景 3：月結客戶流程

```
創建託運單 (PENDING)
    ↓
客戶月結，先不開票
    ↓
標記待收款 (PENDING_PAYMENT)
    ↓
持續追蹤，更新備註
    ↓
月底確認已收款
    ↓
還原 → 標記不需開發票 (NO_INVOICE_NEEDED)
    ↓
流程結束
```

**API 調用順序**:

1. `POST /api/waybill` → 創建託運單
2. `PUT /api/waybill/{id}/pending-payment` → 標記待收款
3. `PUT /api/waybill/{id}/update-notes` → 更新備註（可多次）
4. `PUT /api/waybill/{id}/restore` → 還原為 PENDING
5. `PUT /api/waybill/{id}/no-invoice` → 標記不需開發票

---

### 場景 4：發票作廢後重新開立

```
託運單已開票 (INVOICED)
    ↓
發票資訊錯誤需作廢
    ↓
作廢發票 → 託運單自動還原 (PENDING)
    ↓
修改託運單資料（如需要）
    ↓
重新開立正確的發票 (INVOICED)
    ↓
流程結束
```

**API 調用順序**:

1. `POST /api/invoice/{id}/void` → 作廢發票（託運單自動變為 PENDING）
2. `PUT /api/waybill/{id}` → 修改託運單（可選）
3. `POST /api/invoice` → 重新開立發票

---

### 場景 5：錯誤標記的修正流程

```
託運單標記為不需開發票 (NO_INVOICE_NEEDED)
    ↓
發現錯誤，客戶實際需要發票
    ↓
還原託運單 (PENDING)
    ↓
開立發票 (INVOICED)
    ↓
流程結束
```

**API 調用順序**:

1. `PUT /api/waybill/{id}/restore` → 還原託運單
2. `POST /api/invoice` → 開立發票

---

## 五、批量操作流程

### 批量標記不需開發票

**場景**: 多筆現金交易需要批量標記

**API**: `PUT /api/waybill/no-invoice-batch`

**請求**:

```json
{
  "waybillIds": ["id1", "id2", "id3", ...]
}
```

**處理邏輯**:

- 逐筆檢查狀態（必須為 `PENDING` 或 `PENDING_PAYMENT`）
- 符合條件的變更為 `NO_INVOICE_NEEDED`
- 不符合條件的記錄失敗原因
- 返回成功/失敗統計

---

### 批量還原

**場景**: 多筆誤標記的託運單需要還原

**API**: `PUT /api/waybill/restore-batch`

**請求**:

```json
{
  "waybillIds": ["id1", "id2", "id3", ...]
}
```

**處理邏輯**:

- 逐筆檢查狀態（必須為 `NO_INVOICE_NEEDED` 或 `PENDING_PAYMENT`）
- 符合條件的變更為 `PENDING`
- 不符合條件的記錄失敗原因
- 返回成功/失敗統計

---

## 六、狀態轉換矩陣

| 從 ↓ / 到 →           | PENDING | INVOICED | NO_INVOICE_NEEDED | PENDING_PAYMENT |
| --------------------- | ------- | -------- | ----------------- | --------------- |
| **PENDING**           | -       | ✅ 開票  | ✅ 標記           | ✅ 標記         |
| **INVOICED**          | ✅ 自動 | -        | ❌                | ❌              |
| **NO_INVOICE_NEEDED** | ✅ 還原 | ❌       | -                 | ❌              |
| **PENDING_PAYMENT**   | ✅ 還原 | ❌       | ⚠️ 需還原後再標記 | -               |

**圖例**:

- ✅ 允許直接轉換
- ⚠️ 需要多步驟操作
- ❌ 不允許轉換
- 自動：由系統自動觸發（發票操作）

---

## 七、關鍵業務規則

### 1. 編輯限制

- ✅ **PENDING**: 可編輯所有欄位
- ❌ **INVOICED**: 完全不可編輯（已綁定發票）
- ❌ **NO_INVOICE_NEEDED**: 完全不可編輯（已完成）
- ⚠️ **PENDING_PAYMENT**: 僅可編輯備註欄位

### 2. 刪除限制

- ✅ **PENDING**: 可刪除
- ❌ **其他狀態**: 不可刪除
- 解決方案：先還原為 `PENDING`，再刪除

### 3. 開票限制

- ✅ **PENDING**: 可選入發票
- ❌ **其他狀態**: 不可選入發票

### 4. 資料一致性

- 發票操作與託運單狀態變更在同一資料庫交易中完成
- 操作失敗時完整回滾
- 確保發票和託運單狀態始終保持同步

---

## 八、前端操作按鈕對應

### PENDING 狀態

| 按鈕       | 功能           | API                                     |
| ---------- | -------------- | --------------------------------------- |
| 編輯       | 修改託運單     | `PUT /api/waybill/{id}`                 |
| 刪除       | 刪除託運單     | `DELETE /api/waybill/{id}`              |
| 開立發票   | 跳轉至發票頁面 | 導航至 Finance Page                     |
| 不需開發票 | 標記不需開發票 | `PUT /api/waybill/{id}/no-invoice`      |
| 標記待收款 | 標記待收款狀態 | `PUT /api/waybill/{id}/pending-payment` |

### INVOICED 狀態

| 按鈕           | 功能               | API |
| -------------- | ------------------ | --- |
| 查看           | 唯讀檢視託運單資料 | -   |
| （無其他操作） | 需從發票頁面操作   | -   |

### NO_INVOICE_NEEDED 狀態

| 按鈕 | 功能           | API                             |
| ---- | -------------- | ------------------------------- |
| 查看 | 唯讀檢視       | -                               |
| 還原 | 還原為 PENDING | `PUT /api/waybill/{id}/restore` |

### PENDING_PAYMENT 狀態

| 按鈕     | 功能           | API                                  |
| -------- | -------------- | ------------------------------------ |
| 查看     | 唯讀檢視       | -                                    |
| 編輯備註 | 修改備註欄位   | `PUT /api/waybill/{id}/update-notes` |
| 還原     | 還原為 PENDING | `PUT /api/waybill/{id}/restore`      |

---

## 九、錯誤處理與提示

### 常見錯誤情境

| 錯誤情境                  | HTTP 狀態碼 | 錯誤訊息                                             | 解決方案                  |
| ------------------------- | ----------- | ---------------------------------------------------- | ------------------------- |
| 嘗試編輯 INVOICED 託運單  | 400         | 無法編輯狀態為 'INVOICED' 的託運單                   | 先作廢或刪除發票          |
| 嘗試刪除 INVOICED 託運單  | 400         | 只有 'PENDING' 狀態的託運單可以刪除                  | 先作廢或刪除發票          |
| 嘗試開票非 PENDING 託運單 | 400         | 託運單狀態無效                                       | 確認託運單為 PENDING 狀態 |
| 標記不需開發票時狀態錯誤  | 400         | 只有 'PENDING' 狀態的託運單可以標記                  | 檢查託運單當前狀態        |
| 還原時狀態不符            | 400         | 只有 'NO_INVOICE_NEEDED' 或 'PENDING_PAYMENT' 可還原 | 檢查託運單當前狀態        |

---

## 十、最佳實踐建議

### 1. 建立託運單時的決策

**思考流程**:

1. 客戶是否需要發票？
   - 是 → 一般建立（PENDING）
   - 否 → 繼續下一步
2. 款項是否已收？
   - 是 → 建立時勾選「不需開發票」（NO_INVOICE_NEEDED）
   - 否 → 一般建立後標記為待收款（PENDING_PAYMENT）

### 2. PENDING 狀態的及時處理

- 定期檢視 PENDING 託運單
- 及時決定開票或標記狀態
- 避免長期積壓未處理的託運單

### 3. PENDING_PAYMENT 的追蹤管理

- 善用備註欄位記錄追蹤資訊
- 記錄預計收款日期、聯絡狀況等
- 定期更新備註，保持資訊最新

### 4. 發票操作前的確認

- 開立發票前確認託運單資料正確
- 開票後託運單無法直接編輯
- 需要修改時，必須先處理發票（作廢/刪除）

### 5. 批量操作的使用時機

- 月底結算時批量標記不需開發票
- 批次處理同一客戶的多筆現金交易
- 錯誤操作的批量修正

---

## 十一、與發票管理的協同

### 發票對託運單的影響

| 發票操作   | 對託運單的影響                | 是否可逆 |
| ---------- | ----------------------------- | -------- |
| 新增發票   | 選定的託運單變為 INVOICED     | 是       |
| 編輯發票   | 移除的託運單變為 PENDING      | 是       |
| 刪除發票   | 關聯的託運單全部變為 PENDING  | 否       |
| 作廢發票   | 關聯的託運單全部變為 PENDING  | 是       |
| 還原發票   | 關聯的託運單全部變為 INVOICED | 是       |
| 標記已收款 | 不影響託運單狀態              | -        |

### 託運單額外費用的處理

- 託運單可包含多筆額外費用
- 開立發票時可選擇性勾選額外費用
- 額外費用是否包含稅率影響發票金額計算
- 發票刪除時，額外費用不受影響

---

## 十二、流程決策樹（簡化版）

```
託運單建立完成 (PENDING)
│
├─ 客戶需要發票？
│  └─ 是 → 開立發票 → INVOICED → [結束]
│
├─ 客戶不需發票？
│  │
│  ├─ 已收款？
│  │  └─ 是 → 標記不需開發票 → NO_INVOICE_NEEDED → [結束]
│  │
│  └─ 未收款？
│     └─ 是 → 標記待收款 → PENDING_PAYMENT
│        │
│        ├─ 後續收款？
│        │  └─ 是 → 還原 → 標記不需開發票 → NO_INVOICE_NEEDED → [結束]
│        │
│        └─ 改為需要發票？
│           └─ 是 → 還原 → 開立發票 → INVOICED → [結束]
│
└─ 錄入錯誤？
   └─ 是 → 刪除託運單 → [結束]
```

---

## 十三、統計與報表

### 依狀態統計

- **PENDING**: 待處理託運單數量和金額
- **INVOICED**: 已開票託運單數量和金額
- **NO_INVOICE_NEEDED**: 不需開票（已完成）數量和金額
- **PENDING_PAYMENT**: 待收款託運單數量和金額

### 業務指標

- 平均處理時間（從 PENDING 到最終狀態）
- 開票率（INVOICED / 總數）
- 現金交易率（NO_INVOICE_NEEDED / 總數）
- 應收款追蹤（PENDING_PAYMENT 狀態的追蹤）

---

## 十四、未來擴展可能性

### 1. 自動化流程

- 根據客戶設定自動決定是否開票
- 定期自動提醒未處理的 PENDING 託運單
- 到期未收款的自動提醒

### 2. 進階狀態

- 考慮增加「部分收款」狀態
- 考慮增加「壞帳」狀態用於無法收回的款項

### 3. 審批流程

- 大額託運單需要審批後才能標記為不需開發票
- 作廢發票後的託運單需要審批才能重新開票

---

> **文件版本**: v1.0
> **建立日期**: 2025-01-11
> **基於文件**: waybill-management-feature.md, invoice-management-feature.md
> **維護說明**: 本文件應與實際程式碼保持同步，如有業務流程變更請同步更新
