# API 錯誤處理機制

## 錯誤分類

### 1. 客戶端錯誤 (4xx)
- **400 Bad Request**: 請求格式錯誤
- **401 Unauthorized**: 認證失敗
- **403 Forbidden**: 權限不足
- **404 Not Found**: 資源不存在
- **409 Conflict**: 資源衝突
- **422 Unprocessable Entity**: 業務邏輯錯誤

### 2. 伺服器錯誤 (5xx)
- **500 Internal Server Error**: 伺服器內部錯誤
- **503 Service Unavailable**: 服務暫時不可用

## 錯誤代碼定義

### 通用錯誤代碼
```
VALIDATION_ERROR           # 資料驗證錯誤
RESOURCE_NOT_FOUND         # 資源不存在
UNAUTHORIZED              # 未認證
FORBIDDEN                 # 權限不足
INTERNAL_SERVER_ERROR     # 伺服器內部錯誤
SERVICE_UNAVAILABLE       # 服務不可用
RATE_LIMIT_EXCEEDED       # 請求頻率超限
```

### 業務邏輯錯誤代碼
```
# 公司相關
COMPANY_NOT_FOUND         # 公司不存在
COMPANY_TAX_ID_DUPLICATE  # 統一編號重複
COMPANY_HAS_DEPENDENCIES  # 公司有關聯資料，無法刪除

# 司機相關
DRIVER_NOT_FOUND          # 司機不存在
DRIVER_HAS_DEPENDENCIES   # 司機有關聯資料，無法刪除

# 託運單相關
WAYBILL_NOT_FOUND         # 託運單不存在
WAYBILL_NOT_EDITABLE      # 託運單狀態不可編輯
WAYBILL_ALREADY_INVOICED  # 託運單已開發票
WAYBILL_INVALID_STATUS    # 託運單狀態無效

# 發票相關
INVOICE_NOT_FOUND         # 發票不存在
INVOICE_NUMBER_DUPLICATE  # 發票編號重複
INVOICE_AMOUNT_MISMATCH   # 發票金額不符
INVOICE_INVALID_STATUS    # 發票狀態無效
INVOICE_ALREADY_PAID      # 發票已收款
INVOICE_CANNOT_VOID       # 發票無法作廢
```

## 錯誤回應格式

### 基本錯誤格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "資料驗證失敗",
    "details": []
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "requestId": "req_123456789",
    "version": "1.0"
  }
}
```

### 詳細錯誤格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "資料驗證失敗",
    "details": [
      {
        "field": "invoiceNumber",
        "code": "REQUIRED",
        "message": "發票編號為必填欄位"
      },
      {
        "field": "taxRate",
        "code": "INVALID_RANGE",
        "message": "稅率必須介於 0 到 1 之間"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "requestId": "req_123456789",
    "version": "1.0"
  }
}
```

## 具體錯誤處理範例

### 1. 資料驗證錯誤 (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "資料驗證失敗",
    "details": [
      {
        "field": "name",
        "code": "REQUIRED",
        "message": "公司名稱為必填欄位"
      },
      {
        "field": "taxId",
        "code": "INVALID_FORMAT",
        "message": "統一編號格式不正確，必須為 8 位數字"
      },
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email 格式不正確"
      }
    ]
  }
}
```

### 2. 資源不存在錯誤 (404)
```json
{
  "success": false,
  "error": {
    "code": "WAYBILL_NOT_FOUND",
    "message": "託運單不存在",
    "details": [
      {
        "field": "id",
        "code": "NOT_FOUND",
        "message": "找不到 ID 為 '550e8400-e29b-41d4-a716-446655440020' 的託運單"
      }
    ]
  }
}
```

### 3. 業務邏輯錯誤 (409)
```json
{
  "success": false,
  "error": {
    "code": "INVOICE_NUMBER_DUPLICATE",
    "message": "發票編號重複",
    "details": [
      {
        "field": "invoiceNumber",
        "code": "DUPLICATE",
        "message": "發票編號 'AB12345678' 已存在"
      }
    ]
  }
}
```

### 4. 狀態錯誤 (422)
```json
{
  "success": false,
  "error": {
    "code": "WAYBILL_NOT_EDITABLE",
    "message": "託運單狀態不可編輯",
    "details": [
      {
        "field": "status",
        "code": "INVALID_STATUS",
        "message": "託運單狀態為 'INVOICED'，無法編輯"
      }
    ]
  }
}
```

### 5. 金額驗證錯誤 (422)
```json
{
  "success": false,
  "error": {
    "code": "INVOICE_AMOUNT_MISMATCH",
    "message": "發票金額計算錯誤",
    "details": [
      {
        "field": "total",
        "code": "CALCULATION_ERROR",
        "message": "總金額應為 5450.00，但傳入 5500.00"
      }
    ]
  }
}
```

## 錯誤處理中介軟體

### C# 錯誤處理範例
```csharp
public class ErrorHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = new ErrorResponse();
        
        switch (exception)
        {
            case ValidationException validationEx:
                response.Error.Code = "VALIDATION_ERROR";
                response.Error.Message = "資料驗證失敗";
                response.Error.Details = validationEx.Errors.Select(e => new ErrorDetail
                {
                    Field = e.PropertyName,
                    Code = "VALIDATION_FAILED",
                    Message = e.ErrorMessage
                }).ToList();
                context.Response.StatusCode = 422;
                break;
                
            case NotFoundException notFoundEx:
                response.Error.Code = "RESOURCE_NOT_FOUND";
                response.Error.Message = notFoundEx.Message;
                context.Response.StatusCode = 404;
                break;
                
            case BusinessException businessEx:
                response.Error.Code = businessEx.ErrorCode;
                response.Error.Message = businessEx.Message;
                context.Response.StatusCode = 409;
                break;
                
            default:
                response.Error.Code = "INTERNAL_SERVER_ERROR";
                response.Error.Message = "伺服器內部錯誤";
                context.Response.StatusCode = 500;
                break;
        }
        
        response.Meta.Timestamp = DateTime.UtcNow;
        response.Meta.RequestId = context.TraceIdentifier;
        
        var json = JsonSerializer.Serialize(response);
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(json);
    }
}
```

## 自定義例外類別

### 基礎業務例外
```csharp
public class BusinessException : Exception
{
    public string ErrorCode { get; }
    
    public BusinessException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class NotFoundException : BusinessException
{
    public NotFoundException(string message) : base("RESOURCE_NOT_FOUND", message)
    {
    }
}

public class ValidationException : BusinessException
{
    public List<ValidationError> Errors { get; }
    
    public ValidationException(List<ValidationError> errors) 
        : base("VALIDATION_ERROR", "資料驗證失敗")
    {
        Errors = errors;
    }
}
```

### 具體業務例外
```csharp
public class WaybillNotEditableException : BusinessException
{
    public WaybillNotEditableException(string status) 
        : base("WAYBILL_NOT_EDITABLE", $"託運單狀態為 '{status}'，無法編輯")
    {
    }
}

public class InvoiceNumberDuplicateException : BusinessException
{
    public InvoiceNumberDuplicateException(string invoiceNumber) 
        : base("INVOICE_NUMBER_DUPLICATE", $"發票編號 '{invoiceNumber}' 已存在")
    {
    }
}

public class WaybillAlreadyInvoicedException : BusinessException
{
    public WaybillAlreadyInvoicedException(string waybillNumber) 
        : base("WAYBILL_ALREADY_INVOICED", $"託運單 '{waybillNumber}' 已開發票")
    {
    }
}
```

## 日誌記錄

### 錯誤日誌格式
```json
{
  "timestamp": "2024-01-01T10:00:00Z",
  "level": "ERROR",
  "requestId": "req_123456789",
  "userId": "user_123",
  "method": "POST",
  "path": "/api/v1/invoices",
  "statusCode": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "資料驗證失敗",
    "stackTrace": "..."
  },
  "requestBody": {
    "invoiceNumber": "",
    "date": "2024-01-01"
  },
  "responseTime": 150
}
```

## 錯誤監控與告警

### 監控指標
- 錯誤率 (4xx/5xx 比例)
- 回應時間
- 特定錯誤類型頻率
- 錯誤趨勢分析

### 告警規則
- 5xx 錯誤率超過 1%
- 平均回應時間超過 1 秒
- 特定錯誤類型在 5 分鐘內超過 10 次
- 資料庫連線失敗

## 使用者友善的錯誤訊息

### 中文錯誤訊息對應
```csharp
private static readonly Dictionary<string, string> ErrorMessages = new()
{
    { "COMPANY_NOT_FOUND", "找不到指定的公司" },
    { "WAYBILL_NOT_EDITABLE", "託運單已開發票，無法編輯" },
    { "INVOICE_NUMBER_DUPLICATE", "發票編號重複，請使用其他編號" },
    { "VALIDATION_ERROR", "資料格式不正確，請檢查後重新輸入" },
    { "UNAUTHORIZED", "請先登入後再進行操作" },
    { "FORBIDDEN", "您沒有權限執行此操作" },
    { "INTERNAL_SERVER_ERROR", "系統暫時出現問題，請稍後再試" }
};
```

### 欄位驗證訊息
```csharp
private static readonly Dictionary<string, string> FieldMessages = new()
{
    { "name.required", "公司名稱為必填欄位" },
    { "taxId.format", "統一編號必須為 8 位數字" },
    { "email.format", "請輸入有效的電子郵件地址" },
    { "fee.range", "金額必須大於 0" },
    { "date.future", "日期不可為未來日期" }
};
```