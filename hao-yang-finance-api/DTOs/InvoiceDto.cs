using System.ComponentModel.DataAnnotations;

namespace hao_yang_finance_api.DTOs
{
    // 發票查詢回應 DTO
    public class InvoiceDto
    {
        public string Id { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal TaxRate { get; set; }
        public bool ExtraExpensesIncludeTax { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? PaymentNote { get; set; }
        public string? Notes { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
        public string? PaidAt { get; set; }

        // 關聯資料
        public List<InvoiceWaybillDto> Waybills { get; set; } = new List<InvoiceWaybillDto>();
        public List<InvoiceExtraExpenseDto> ExtraExpenses { get; set; } = new List<InvoiceExtraExpenseDto>();
    }

    // 建立發票請求 DTO
    public class CreateInvoiceDto
    {
        [Required(ErrorMessage = "發票號碼為必填")]
        [MaxLength(50, ErrorMessage = "發票號碼不可超過50字元")]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "發票日期為必填")] public string Date { get; set; } = string.Empty;

        [Required(ErrorMessage = "公司ID為必填")] public string CompanyId { get; set; } = string.Empty;

        [Required(ErrorMessage = "稅率為必填")]
        [Range(0, 1, ErrorMessage = "稅率必須介於0到1之間")]
        public decimal TaxRate { get; set; } = 0.05m;

        public bool ExtraExpensesIncludeTax { get; set; } = false;

        public string? Notes { get; set; }

        [Required(ErrorMessage = "託運單列表不可為空")]
        [MinLength(1, ErrorMessage = "至少需要選擇一筆託運單")]
        public List<string> WaybillIds { get; set; } = new List<string>();

        public List<string> ExtraExpenseIds { get; set; } = new List<string>();
    }

    // 更新發票請求 DTO
    public class UpdateInvoiceDto
    {
        [Required(ErrorMessage = "發票號碼為必填")]
        [MaxLength(50, ErrorMessage = "發票號碼不可超過50字元")]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "發票日期為必填")] public string Date { get; set; } = string.Empty;

        [Required(ErrorMessage = "稅率為必填")]
        [Range(0, 1, ErrorMessage = "稅率必須介於0到1之間")]
        public decimal TaxRate { get; set; }

        public bool ExtraExpensesIncludeTax { get; set; }

        public string? Notes { get; set; }

        [Required(ErrorMessage = "託運單列表不可為空")]
        [MinLength(1, ErrorMessage = "至少需要選擇一筆託運單")]
        public List<string> WaybillIds { get; set; } = new List<string>();

        public List<string> ExtraExpenseIds { get; set; } = new List<string>();
    }

    // 標記收款請求 DTO
    public class MarkInvoicePaidDto
    {
        [Required(ErrorMessage = "付款方式為必填")]
        [MaxLength(20, ErrorMessage = "付款方式不可超過20字元")]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? PaymentNote { get; set; }
    }

    // 發票託運單關聯 DTO
    public class InvoiceWaybillDto
    {
        public string Id { get; set; } = string.Empty;
        public string WaybillId { get; set; } = string.Empty;
        public string WaybillNumber { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public string DriverName { get; set; } = string.Empty;

        public bool? ExtraExpensesIncludeTax { get; set; }
        public List<InvoiceExtraExpenseDto>? ExtraExpenses { get; set; }
    }

    // 發票額外費用關聯 DTO
    public class InvoiceExtraExpenseDto
    {
        public string Id { get; set; } = string.Empty;
        public string ExtraExpenseId { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public string? Notes { get; set; }
        public string WaybillNumber { get; set; } = string.Empty;
    }

    // 發票查詢參數 DTO
    public class InvoiceQueryDto
    {
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? CompanyId { get; set; }
        public string? Status { get; set; }
        public string? InvoiceNumber { get; set; }
    }

    // 發票統計 DTO
    public class InvoiceStatsDto
    {
        public int TotalInvoices { get; set; }
        public int PaidInvoices { get; set; }
        public int UnpaidInvoices { get; set; }
        public int VoidInvoices { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal UnpaidAmount { get; set; }
    }
}