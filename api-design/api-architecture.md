# 皓揚財務追蹤系統 - API 架構設計

## 整體架構

### RESTful API 設計原則
- 使用標準 HTTP 動詞 (GET, POST, PUT, DELETE)
- 使用有意義的 URL 結構
- 返回適當的 HTTP 狀態碼
- 使用 JSON 格式進行資料交換
- 實現統一的錯誤處理機制

### API 版本控制
- 使用 URL 路徑版本控制: `/api/v1/`
- 為未來擴展預留空間

### 認證與授權
- 使用 JWT Token 認證 (未來實現)
- 基於角色的權限控制 (未來實現)

## API 端點架構

### 基礎 URL 結構
```
https://api.haoyang-finance.com/api/v1/
```

### 主要資源端點

#### 1. 公司管理 (Companies)
```
GET    /api/v1/companies              # 取得公司列表
POST   /api/v1/companies              # 新增公司
GET    /api/v1/companies/{id}         # 取得單一公司
PUT    /api/v1/companies/{id}         # 更新公司
DELETE /api/v1/companies/{id}         # 刪除公司
```

#### 2. 司機管理 (Drivers)
```
GET    /api/v1/drivers                # 取得司機列表
POST   /api/v1/drivers                # 新增司機
GET    /api/v1/drivers/{id}           # 取得單一司機
PUT    /api/v1/drivers/{id}           # 更新司機
DELETE /api/v1/drivers/{id}           # 刪除司機
```

#### 3. 託運單管理 (Waybills)
```
GET    /api/v1/waybills               # 取得託運單列表
POST   /api/v1/waybills               # 新增託運單
GET    /api/v1/waybills/{id}          # 取得單一託運單
PUT    /api/v1/waybills/{id}          # 更新託運單
DELETE /api/v1/waybills/{id}          # 刪除託運單

# 狀態管理
PUT    /api/v1/waybills/{id}/no-invoice    # 標記為不需開發票
PUT    /api/v1/waybills/{id}/restore       # 還原為待開發票

# 子資源
GET    /api/v1/waybills/{id}/loading-locations    # 取得載貨地點
POST   /api/v1/waybills/{id}/loading-locations    # 新增載貨地點
PUT    /api/v1/waybills/{id}/loading-locations/{location_id}  # 更新載貨地點
DELETE /api/v1/waybills/{id}/loading-locations/{location_id}  # 刪除載貨地點

GET    /api/v1/waybills/{id}/extra-expenses       # 取得額外費用
POST   /api/v1/waybills/{id}/extra-expenses       # 新增額外費用
PUT    /api/v1/waybills/{id}/extra-expenses/{expense_id}     # 更新額外費用
DELETE /api/v1/waybills/{id}/extra-expenses/{expense_id}     # 刪除額外費用
```

#### 4. 發票管理 (Invoices)
```
GET    /api/v1/invoices               # 取得發票列表
POST   /api/v1/invoices               # 新增發票
GET    /api/v1/invoices/{id}          # 取得單一發票
PUT    /api/v1/invoices/{id}          # 更新發票
DELETE /api/v1/invoices/{id}          # 刪除發票

# 狀態管理
POST   /api/v1/invoices/{id}/void     # 作廢發票
POST   /api/v1/invoices/{id}/mark-paid # 標記已收款

# 驗證功能
GET    /api/v1/invoices/{id}/validate # 驗證發票金額
```

#### 5. 查詢與報表 (Queries & Reports)
```
GET    /api/v1/waybills/pending       # 取得待開發票託運單
GET    /api/v1/waybills/invoiceable   # 取得可開發票託運單（按公司分組）
GET    /api/v1/invoices/summary       # 發票摘要統計
GET    /api/v1/reports/monthly        # 月度報表
```

## 查詢參數標準

### 分頁參數
```
page=1          # 頁碼 (預設: 1)
limit=50        # 每頁筆數 (預設: 50, 最大: 100)
```

### 排序參數
```
sort=field      # 排序欄位
order=asc|desc  # 排序方向 (預設: asc)
```

### 篩選參數
```
# 託運單篩選
status=PENDING|INVOICED|NO_INVOICE_NEEDED
company_id=uuid
driver_id=uuid
date_from=2024-01-01
date_to=2024-12-31

# 發票篩選
status=issued|paid|void
company_id=uuid
invoice_number=ABC12345678
```

### 搜尋參數
```
search=關鍵字   # 全文搜尋
```

## HTTP 狀態碼使用標準

### 成功狀態碼
- `200 OK` - 成功取得資源
- `201 Created` - 成功建立資源
- `204 No Content` - 成功執行但無內容返回

### 客戶端錯誤
- `400 Bad Request` - 請求格式錯誤
- `401 Unauthorized` - 未授權
- `403 Forbidden` - 禁止存取
- `404 Not Found` - 資源不存在
- `409 Conflict` - 資源衝突 (如重複的發票編號)
- `422 Unprocessable Entity` - 資料驗證錯誤

### 伺服器錯誤
- `500 Internal Server Error` - 伺服器內部錯誤
- `503 Service Unavailable` - 服務暫時不可用

## 資料格式標準

### 日期時間格式
- 使用 ISO 8601 格式: `2024-01-01T10:00:00Z`
- 日期格式: `2024-01-01`
- 時間格式: `10:00:00`

### 金額格式
- 使用數字類型，保留兩位小數
- 單位為新台幣 (TWD)

### UUID 格式
- 使用標準 UUID v4 格式
- 範例: `550e8400-e29b-41d4-a716-446655440000`

## 快取策略

### 快取標頭
```
Cache-Control: max-age=3600, must-revalidate
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

### 快取策略
- 主資料 (公司、司機): 快取 1 小時
- 託運單: 快取 5 分鐘
- 發票: 快取 10 分鐘
- 報表: 快取 30 分鐘

## 安全性考量

### 輸入驗證
- 所有輸入都必須經過嚴格驗證
- 使用白名單驗證方式
- 防止 SQL 注入攻擊

### 輸出編碼
- 所有輸出都進行適當編碼
- 防止 XSS 攻擊

### 率限制
- 每個 IP 每分鐘最多 1000 次請求
- 每個使用者每分鐘最多 500 次請求

## 效能最佳化

### 資料庫查詢最佳化
- 使用適當的索引
- 避免 N+1 查詢問題
- 使用分頁減少資料傳輸

### 回應最佳化
- 使用 GZIP 壓縮
- 最小化 JSON 回應大小
- 使用 CDN 加速靜態資源

## 監控與日誌

### 日誌記錄
- 記錄所有 API 請求和回應
- 記錄錯誤和異常情況
- 記錄效能指標

### 監控指標
- 回應時間
- 錯誤率
- 請求量
- 資料庫連線數