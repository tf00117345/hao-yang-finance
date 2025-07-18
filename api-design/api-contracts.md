# API 請求/回應格式定義

## 通用回應格式

### 成功回應結構
```json
{
  "success": true,
  "data": {
    // 實際資料內容
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "version": "1.0"
  }
}
```

### 分頁回應結構
```json
{
  "success": true,
  "data": [
    // 資料陣列
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2024-01-01T10:00:00Z",
    "version": "1.0"
  }
}
```

### 錯誤回應結構
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "資料驗證失敗",
    "details": [
      {
        "field": "invoiceNumber",
        "message": "發票編號已存在"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "version": "1.0"
  }
}
```

## 公司管理 API

### GET /api/v1/companies
**查詢公司列表**

請求參數:
```
?page=1&limit=50&search=公司名稱&is_active=true
```

回應範例:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "測試公司 A",
      "taxId": "12345678",
      "contactPerson": "張三",
      "phone": "02-12345678",
      "address": "台北市中正區測試路1號",
      "email": "test@company.com",
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /api/v1/companies
**新增公司**

請求格式:
```json
{
  "name": "測試公司 B",
  "taxId": "87654321",
  "contactPerson": "李四",
  "phone": "02-87654321",
  "address": "新北市板橋區測試街2號",
  "email": "test2@company.com"
}
```

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "測試公司 B",
    "taxId": "87654321",
    "contactPerson": "李四",
    "phone": "02-87654321",
    "address": "新北市板橋區測試街2號",
    "email": "test2@company.com",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

## 司機管理 API

### GET /api/v1/drivers
**查詢司機列表**

回應範例:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "司機甲",
      "phone": "0912345678",
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/drivers
**新增司機**

請求格式:
```json
{
  "name": "司機乙",
  "phone": "0987654321"
}
```

## 託運單管理 API

### GET /api/v1/waybills
**查詢託運單列表**

請求參數:
```
?page=1&limit=50&status=PENDING&company_id=uuid&date_from=2024-01-01&date_to=2024-12-31
```

回應範例:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "waybillNumber": "WB240001",
      "date": "2024-01-01",
      "item": "建材運送",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "companyName": "測試公司 A",
      "loadingLocations": [
        {
          "from": "台北市中正區",
          "to": "新北市板橋區"
        }
      ],
      "workingTime": {
        "start": "08:00:00",
        "end": "17:00:00"
      },
      "fee": 5000.00,
      "driverId": "550e8400-e29b-41d4-a716-446655440010",
      "driverName": "司機甲",
      "plateNumber": "ABC-1234",
      "notes": "備註",
      "extraExpenses": [
        {
          "item": "過路費",
          "fee": 200.00,
          "notes": "高速公路過路費"
        }
      ],
      "status": "PENDING",
      "invoiceId": null,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/waybills
**新增託運單**

請求格式:
```json
{
  "waybillNumber": "WB240002",
  "date": "2024-01-02",
  "item": "鋼材運送",
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "loadingLocations": [
    {
      "from": "台北市中正區建國路100號",
      "to": "新北市板橋區中山路200號"
    }
  ],
  "workingTime": {
    "start": "08:00:00",
    "end": "17:00:00"
  },
  "fee": 8000.00,
  "driverId": "550e8400-e29b-41d4-a716-446655440010",
  "plateNumber": "ABC-1234",
  "notes": "小心搬運",
  "extraExpenses": [
    {
      "item": "過路費",
      "fee": 300.00,
      "notes": "高速公路過路費"
    },
    {
      "item": "停車費",
      "fee": 100.00,
      "notes": "工地停車費"
    }
  ]
}
```

### PUT /api/v1/waybills/{id}/no-invoice
**標記託運單為不需開發票**

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "status": "NO_INVOICE_NEEDED",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### PUT /api/v1/waybills/{id}/restore
**還原託運單為待開發票**

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "status": "PENDING",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

## 發票管理 API

### GET /api/v1/invoices
**查詢發票列表**

請求參數:
```
?page=1&limit=50&status=issued&company_id=uuid&date_from=2024-01-01&date_to=2024-12-31
```

回應範例:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "invoiceNumber": "AB12345678",
      "date": "2024-01-01",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "companyName": "測試公司 A",
      "subtotal": 5200.00,
      "taxRate": 0.05,
      "extraExpensesIncludeTax": false,
      "tax": 250.00,
      "total": 5450.00,
      "status": "issued",
      "paymentMethod": null,
      "paymentNote": null,
      "notes": "發票備註",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "paidAt": null,
      "waybills": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "waybillNumber": "WB240001",
          "fee": 5000.00
        }
      ],
      "extraExpenses": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440040",
          "item": "過路費",
          "amount": 200.00
        }
      ]
    }
  ]
}
```

### POST /api/v1/invoices
**新增發票**

請求格式:
```json
{
  "invoiceNumber": "AB12345679",
  "date": "2024-01-02",
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "taxRate": 0.05,
  "extraExpensesIncludeTax": false,
  "notes": "發票備註",
  "waybillIds": [
    "550e8400-e29b-41d4-a716-446655440020"
  ],
  "extraExpenseIds": [
    "550e8400-e29b-41d4-a716-446655440040"
  ]
}
```

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440031",
    "invoiceNumber": "AB12345679",
    "date": "2024-01-02",
    "companyId": "550e8400-e29b-41d4-a716-446655440000",
    "companyName": "測試公司 A",
    "subtotal": 5200.00,
    "taxRate": 0.05,
    "extraExpensesIncludeTax": false,
    "tax": 250.00,
    "total": 5450.00,
    "status": "issued",
    "paymentMethod": null,
    "paymentNote": null,
    "notes": "發票備註",
    "createdAt": "2024-01-02T10:00:00Z",
    "updatedAt": "2024-01-02T10:00:00Z",
    "paidAt": null
  }
}
```

### POST /api/v1/invoices/{id}/mark-paid
**標記發票已收款**

請求格式:
```json
{
  "paymentMethod": "轉帳",
  "paymentNote": "客戶已於 2024-01-05 轉帳付款",
  "paidAt": "2024-01-05T14:30:00Z"
}
```

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "status": "paid",
    "paymentMethod": "轉帳",
    "paymentNote": "客戶已於 2024-01-05 轉帳付款",
    "paidAt": "2024-01-05T14:30:00Z",
    "updatedAt": "2024-01-05T14:30:00Z"
  }
}
```

### POST /api/v1/invoices/{id}/void
**作廢發票**

請求格式:
```json
{
  "reason": "客戶取消訂單"
}
```

回應範例:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "status": "void",
    "updatedAt": "2024-01-05T14:30:00Z"
  }
}
```

## 特殊查詢 API

### GET /api/v1/waybills/pending
**取得待開發票託運單**

回應範例:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "waybillNumber": "WB240001",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "companyName": "測試公司 A",
      "fee": 5000.00,
      "status": "PENDING"
    }
  ]
}
```

### GET /api/v1/waybills/invoiceable
**取得可開發票託運單（按公司分組）**

回應範例:
```json
{
  "success": true,
  "data": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "companyName": "測試公司 A",
      "waybills": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "waybillNumber": "WB240001",
          "fee": 5000.00,
          "extraExpenses": [
            {
              "id": "550e8400-e29b-41d4-a716-446655440040",
              "item": "過路費",
              "fee": 200.00
            }
          ]
        }
      ],
      "totalAmount": 5200.00
    }
  }
}
```

### GET /api/v1/invoices/{id}/validate
**驗證發票金額**

回應範例:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "calculation": {
      "waybillTotal": 5000.00,
      "extraExpenseTotal": 200.00,
      "subtotal": 5200.00,
      "tax": 250.00,
      "total": 5450.00
    },
    "discrepancies": []
  }
}
```

## 資料驗證規則

### 公司資料驗證
- `name`: 必填，最大長度 100 字元
- `taxId`: 選填，必須為 8 位數字
- `phone`: 選填，台灣電話格式
- `email`: 選填，有效的 email 格式

### 託運單資料驗證
- `waybillNumber`: 必填，最大長度 50 字元
- `date`: 必填，不可未來日期
- `fee`: 必填，大於等於 0
- `workingTime.start`: 必填，時間格式
- `workingTime.end`: 必填，必須大於開始時間

### 發票資料驗證
- `invoiceNumber`: 必填，唯一，最大長度 50 字元
- `date`: 必填，不可未來日期
- `taxRate`: 必填，0 到 1 之間
- `waybillIds`: 必填，陣列不可為空，所有託運單必須為 PENDING 狀態
- `extraExpenseIds`: 選填，必須屬於指定的託運單