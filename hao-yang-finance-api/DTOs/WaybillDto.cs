namespace hao_yang_finance_api.DTOs
{
    public class WaybillDto
    {
        public string Id { get; set; } = string.Empty;
        public string? WaybillNumber { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Tonnage { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? WorkingTimeStart { get; set; }
        public string? WorkingTimeEnd { get; set; }
        public decimal Fee { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Status { get; set; } = "PENDING";
        public string? InvoiceId { get; set; }
        public List<LoadingLocationDto> LoadingLocations { get; set; } = new List<LoadingLocationDto>();
        public List<ExtraExpenseDto> ExtraExpenses { get; set; } = new List<ExtraExpenseDto>();
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreateWaybillDto
    {
        public string? WaybillNumber { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Tonnage { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string? WorkingTimeStart { get; set; }
        public string? WorkingTimeEnd { get; set; }
        public decimal Fee { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool MarkAsNoInvoiceNeeded { get; set; } = false;
        public List<LoadingLocationDto> LoadingLocations { get; set; } = new List<LoadingLocationDto>();
        public List<ExtraExpenseDto> ExtraExpenses { get; set; } = new List<ExtraExpenseDto>();
    }

    public class UpdateWaybillDto
    {
        public string? WaybillNumber { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Tonnage { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string? WorkingTimeStart { get; set; }
        public string? WorkingTimeEnd { get; set; }
        public decimal Fee { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<LoadingLocationDto> LoadingLocations { get; set; } = new List<LoadingLocationDto>();
        public List<ExtraExpenseDto> ExtraExpenses { get; set; } = new List<ExtraExpenseDto>();
    }

    public class LoadingLocationDto
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
    }

    public class ExtraExpenseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public string? Notes { get; set; }
    }
}