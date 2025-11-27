# 批量請款功能 UI 實施指南

## 概述

本文檔說明批量請款功能的前端 UI 實施細節，包含所有已創建的組件及其整合方式。

## 已實施的組件

### 1. CollectionRequestTable（請款單列表）
**位置**: `hao-yang-finance-app/src/features/Finance/components/CollectionRequestTable/CollectionRequestTable.tsx`

**功能**:
- 顯示請款單列表（支持篩選：公司、狀態、日期範圍）
- 顯示請款單基本資訊：請款單號、日期、公司、金額、託運單數、狀態
- 提供操作按鈕：
  - 查看詳情（所有狀態）
  - 標記已收款（requested 狀態）
  - 取消請款（requested 狀態）
  - 刪除請款單（cancelled 狀態）

**使用方式**:
```tsx
<CollectionRequestTable
	companyId="optional-company-id"
	status={CollectionRequestStatus.Requested}
	startDate="2024-01-01"
	endDate="2024-12-31"
/>
```

### 2. CollectionRequestDetailDialog（請款單詳情對話框）
**位置**: `hao-yang-finance-app/src/features/Finance/components/CollectionRequestDetailDialog/CollectionRequestDetailDialog.tsx`

**功能**:
- 顯示請款單完整資訊
- 顯示基本資訊：請款單號、日期、公司、狀態
- 顯示金額明細：小計、稅額、總計
- 顯示收款資訊（如已收款）
- 顯示關聯託運單列表（含日期、品項、司機、車號、運費、稅額）
- 顯示備註

**使用方式**:
```tsx
<CollectionRequestDetailDialog
	open={dialogOpen}
	collectionRequestId="collection-request-uuid"
	onClose={() => setDialogOpen(false)}
/>
```

### 3. MarkCollectionPaidDialog（標記已收款對話框）
**位置**: `hao-yang-finance-app/src/features/Finance/components/MarkCollectionPaidDialog/MarkCollectionPaidDialog.tsx`

**功能**:
- 顯示請款單摘要資訊
- 輸入收款資訊：
  - 收款日期（必填）
  - 收款方式（必填，下拉選擇：現金/轉帳/支票/匯款/其他）
  - 收款備註（選填）
- 提示將批量更新所有關聯託運單

**使用方式**:
```tsx
<MarkCollectionPaidDialog
	open={dialogOpen}
	collectionRequest={selectedRequest}
	onClose={() => setDialogOpen(false)}
/>
```

### 4. CancelCollectionRequestDialog（取消請款對話框）
**位置**: `hao-yang-finance-app/src/features/Finance/components/CancelCollectionRequestDialog/CancelCollectionRequestDialog.tsx`

**功能**:
- 顯示請款單摘要資訊
- 輸入取消原因（選填）
- 提示將批量還原所有關聯託運單為 PENDING 狀態

**使用方式**:
```tsx
<CancelCollectionRequestDialog
	open={dialogOpen}
	collectionRequest={selectedRequest}
	onClose={() => setDialogOpen(false)}
/>
```

### 5. CreateCollectionRequestDialog（建立請款單對話框）
**位置**: `hao-yang-finance-app/src/features/Finance/components/CreateCollectionRequestDialog/CreateCollectionRequestDialog.tsx`

**功能**:
- 顯示選中的託運單列表
- 驗證所有託運單屬於同一公司
- 輸入請款日期（必填）
- 輸入備註（選填）
- 顯示金額計算明細：小計、稅額(5%)、總計
- 提示將批量標記所有託運單為 COLLECTION_REQUESTED

**使用方式**:
```tsx
<CreateCollectionRequestDialog
	open={dialogOpen}
	waybills={selectedWaybills}
	onClose={() => setDialogOpen(false)}
	onSuccess={() => {
		// 處理成功後的邏輯
	}}
/>
```

## 整合到現有頁面

### UninvoicedTable 修改
**位置**: `hao-yang-finance-app/src/features/Finance/components/UninvoicedTable/UninvoicedTable.tsx`

**修改內容**:
1. 新增 import:
   ```tsx
   import { CreateCollectionRequestDialog } from '../CreateCollectionRequestDialog/CreateCollectionRequestDialog';
   ```

2. 新增狀態:
   ```tsx
   const [collectionRequestDialogOpen, setCollectionRequestDialogOpen] = useState(false);
   const [collectionRequestWaybills, setCollectionRequestWaybills] = useState<Waybill[]>([]);
   ```

3. 新增處理函數:
   ```tsx
   const handleOpenCollectionRequestDialog = useCallback(() => { ... });
   const handleCollectionRequestCreated = useCallback(() => { ... });
   ```

4. 新增按鈕（在「開發票」和「歸類到司機收現金」之間）:
   ```tsx
   <Button
       size="small"
       color="info"
       variant="contained"
       startIcon={<GroupIcon />}
       onClick={handleOpenCollectionRequestDialog}
       disabled={table.getSelectedRowModel().rows.length === 0}
   >
       批量請款
   </Button>
   ```

5. 新增對話框:
   ```tsx
   <CreateCollectionRequestDialog
       open={collectionRequestDialogOpen}
       waybills={collectionRequestWaybills}
       onClose={() => setCollectionRequestDialogOpen(false)}
       onSuccess={handleCollectionRequestCreated}
   />
   ```

### FinancePage 修改
**位置**: `hao-yang-finance-app/src/features/Finance/components/FinancePage/FinancePage.tsx`

**修改內容**:
1. 新增 import:
   ```tsx
   import { CollectionRequestTable } from '../CollectionRequestTable/CollectionRequestTable';
   ```

2. 新增 Tab:
   ```tsx
   <Tabs value={tab} onChange={handleTabChange}>
       <Tab label="待處理之貨運單" />
       <Tab label="請款單管理" />  {/* 新增 */}
       <Tab label="公司應收款項之貨運單" />
       <Tab label="司機收現金之貨運單" />
       <Tab label="已開立發票" />
   </Tabs>
   ```

3. 調整 Tab 內容渲染（索引調整）:
   ```tsx
   {!isWaybillsPending && tab === 0 && <UninvoicedTable waybills={uninvoicedWaybills} />}
   {tab === 1 && <CollectionRequestTable startDate={startDate} endDate={endDate} />}
   {!isWaybillsPending && tab === 2 && <CashPaymentTable waybills={cashPaymentWaybills} />}
   {!isWaybillsPending && tab === 3 && <NoInvoicedNeededTable waybills={noInvoicedNeededWaybills} />}
   {!isInvoicesPending && tab === 4 && <InvoicedTable invoices={invoices} onEdit={handleEditInvoice} />}
   ```

## 業務流程

### 1. 建立請款單流程
1. 用戶在「待處理之貨運單」頁面選擇多筆 PENDING 狀態的託運單
2. 點擊「批量請款」按鈕
3. 系統驗證：
   - 所有託運單必須是 PENDING 狀態
   - 所有託運單必須屬於同一公司
4. 顯示 CreateCollectionRequestDialog
5. 用戶填寫請款日期和備註
6. 系統自動計算金額：
   - 小計 = 所有託運單運費總和
   - 稅額 = 小計 × 5%
   - 總計 = 小計 + 稅額
7. 用戶確認後：
   - API 創建請款單
   - 所有託運單狀態更新為 COLLECTION_REQUESTED
   - 自動產生請款單號（格式：CR-YYYYMMDD-XXX）

### 2. 標記已收款流程
1. 用戶在「請款單管理」頁面查看請款單列表
2. 對於 requested 狀態的請款單，點擊「標記已收款」按鈕
3. 顯示 MarkCollectionPaidDialog
4. 用戶輸入：
   - 收款日期
   - 收款方式
   - 收款備註（選填）
5. 用戶確認後：
   - 請款單狀態更新為 paid
   - 所有關聯託運單狀態更新為 NEED_TAX_PAID
   - 批量更新託運單的收款資訊

### 3. 取消請款單流程
1. 用戶在「請款單管理」頁面查看請款單列表
2. 對於 requested 狀態的請款單，點擊「取消請款」按鈕
3. 顯示 CancelCollectionRequestDialog
4. 用戶輸入取消原因（選填）
5. 用戶確認後：
   - 請款單狀態更新為 cancelled
   - 所有關聯託運單狀態還原為 PENDING
   - 清除託運單的稅額和收款資訊

### 4. 刪除請款單流程
1. 用戶在「請款單管理」頁面查看請款單列表
2. 對於 cancelled 狀態的請款單，點擊「刪除」按鈕
3. 系統確認對話框
4. 用戶確認後：
   - 請款單記錄被刪除
   - 關聯託運單的 collectionRequestId 被清除

## 狀態管理

### 託運單狀態流程
```
PENDING → (建立請款單) → COLLECTION_REQUESTED → (標記已收款) → NEED_TAX_PAID
                                ↓
                          (取消請款單)
                                ↓
                            PENDING
```

### 請款單狀態流程
```
requested → (標記已收款) → paid
    ↓
(取消請款單)
    ↓
cancelled → (刪除) → [已刪除]
```

## UI/UX 設計原則

### 顏色方案
- **requested** (已請款): info 色（藍色）- 表示等待處理
- **paid** (已收款): success 色（綠色）- 表示完成
- **cancelled** (已取消): error 色（紅色）- 表示取消

### 操作確認
- 所有破壞性操作（取消、刪除）都需要用戶確認
- 批量操作會顯示影響的託運單數量

### 資訊展示
- 金額格式化為台幣格式（NT$）
- 日期格式化為 yyyy/MM/dd
- 顯示託運單數量作為 Chip 標籤

### 錯誤處理
- API 錯誤會透過 alert 或 snackbar 顯示
- 業務規則驗證失敗會在對話框中顯示錯誤訊息

## 測試建議

### 功能測試
1. **建立請款單**:
   - 選擇單一公司的多筆託運單
   - 選擇多家公司的託運單（應顯示錯誤）
   - 選擇非 PENDING 狀態的託運單（應無法選擇）

2. **標記已收款**:
   - 驗證所有關聯託運單狀態正確更新
   - 驗證收款資訊正確保存

3. **取消請款單**:
   - 驗證所有關聯託運單還原為 PENDING
   - 驗證稅額和收款資訊被清除

4. **刪除請款單**:
   - 只有 cancelled 狀態可刪除
   - 驗證關聯託運單的 collectionRequestId 被清除

### UI 測試
1. 響應式設計：確保在不同螢幕尺寸下正常顯示
2. 載入狀態：確保 loading 指示器正常顯示
3. 表格捲動：確保大量資料時表格可正常捲動
4. 對話框關閉：確保所有對話框可正常打開和關閉

### 整合測試
1. 與後端 API 的整合
2. React Query 快取失效正確觸發
3. 跨組件狀態同步（例如：建立請款單後，待處理列表自動更新）

## 後續擴展

### 可能的功能增強
1. **批量操作優化**:
   - 支持選擇性勾選託運單（從已選列表中移除）
   - 顯示選中託運單的詳細資訊

2. **篩選和搜索**:
   - 在 CollectionRequestTable 添加搜索框
   - 支持按請款單號快速搜索
   - 支持複雜篩選條件組合

3. **報表功能**:
   - 匯出請款單為 PDF
   - 匯出託運單明細為 Excel
   - 請款統計圖表

4. **通知功能**:
   - 請款單即將到期提醒
   - 長時間未收款提醒
   - 批量操作完成通知

5. **權限控制**:
   - 不同角色的操作權限
   - 敏感操作需要二次驗證

## 結論

批量請款功能的 UI 已完整實施，包含所有必要的組件和業務流程。所有組件遵循 Material-UI 設計規範，使用 React Hooks 和 TypeScript 進行開發，與現有系統架構完全整合。

---

**文件版本**: v1.0
**建立日期**: 2025-01-17
**作者**: Claude Code
**狀態**: 已完成
