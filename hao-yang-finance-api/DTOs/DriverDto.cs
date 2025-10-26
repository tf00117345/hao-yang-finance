namespace hao_yang_finance_api.DTOs
{
    public class DriverDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
        public decimal ProfitShareRatio { get; set; }
        public decimal TruckTonnage { get; set; } = 11;
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreateDriverDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    public class UpdateDriverDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
    }
}