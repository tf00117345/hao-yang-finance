namespace hao_yang_finance_api.DTOs
{
    public class DriverStatsDto
    {
        public string DriverId { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public int TotalWaybills { get; set; }
        public int PendingWaybills { get; set; }
        public int InvoicedWaybills { get; set; }
        public int NoInvoiceNeededWaybills { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PendingRevenue { get; set; }
        public decimal InvoicedRevenue { get; set; }
        public decimal NoInvoiceNeededRevenue { get; set; }
        public decimal AverageWaybillFee { get; set; }
        public string FirstWaybillDate { get; set; } = string.Empty;
        public string LastWaybillDate { get; set; } = string.Empty;
        public List<MonthlyStatsDto> MonthlyStats { get; set; } = new List<MonthlyStatsDto>();
    }

    public class MonthlyStatsDto
    {
        public string Month { get; set; } = string.Empty; // YYYY-MM format
        public int WaybillCount { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageFee { get; set; }
    }

    public class DriverStatsQueryDto
    {
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? DriverId { get; set; }
        public bool IncludeMonthlyBreakdown { get; set; } = false;
    }

    public class DriverStatsSummaryDto
    {
        public int TotalDrivers { get; set; }
        public int ActiveDrivers { get; set; } // 有業績的司機數量
        public decimal TotalRevenue { get; set; }
        public decimal AverageRevenuePerDriver { get; set; }
        public int TotalWaybills { get; set; }
        public decimal AverageWaybillsPerDriver { get; set; }
        public List<DriverStatsDto> TopDrivers { get; set; } = new List<DriverStatsDto>();
        public List<DriverStatsDto> AllDrivers { get; set; } = new List<DriverStatsDto>();
    }
}