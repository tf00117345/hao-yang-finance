namespace hao_yang_finance_api.DTOs
{
    public class WaybillFeeSplitDto
    {
        public string Id { get; set; } = string.Empty;
        public string WaybillId { get; set; } = string.Empty;
        public string TargetDriverId { get; set; } = string.Empty;
        public string TargetDriverName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreateWaybillFeeSplitDto
    {
        public string TargetDriverId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
    }

    public class SaveWaybillFeeSplitsDto
    {
        public List<CreateWaybillFeeSplitDto> Splits { get; set; } = new();
    }
}
