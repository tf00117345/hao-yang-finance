namespace hao_yang_finance_api.DTOs
{
    public class CreateCollectionRequestDto
    {
        public string? RequestNumber { get; set; }
        public string RequestDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
        public string CompanyId { get; set; } = string.Empty;
        public List<string> WaybillIds { get; set; } = new();
        public string? Notes { get; set; }
    }

    public class MarkCollectionPaidDto
    {
        public string PaymentReceivedAt { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? PaymentNotes { get; set; }
    }

    public class CancelCollectionRequestDto
    {
        public string? CancelReason { get; set; }
    }

    public class CollectionRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string RequestNumber { get; set; } = string.Empty;
        public string RequestDate { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TaxRate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? PaymentReceivedAt { get; set; }
        public string? PaymentMethod { get; set; }
        public string? PaymentNotes { get; set; }
        public int WaybillCount { get; set; }
        public List<string>? WaybillIds { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CollectionRequestDetailDto : CollectionRequestDto
    {
        public List<CollectionRequestWaybillDto> Waybills { get; set; } = new();
    }

    public class CollectionRequestWaybillDto
    {
        public string Id { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public decimal? TaxAmount { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }
    }

    public class BatchOperationResultDto
    {
        public string Message { get; set; } = string.Empty;
        public string? CollectionRequestId { get; set; }
        public int AffectedWaybills { get; set; }
        public List<BatchOperationDetailDto> Details { get; set; } = new();
    }

    public class BatchOperationDetailDto
    {
        public string WaybillId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}