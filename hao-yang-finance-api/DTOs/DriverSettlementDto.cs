namespace hao_yang_finance_api.DTOs
{
    public class DriverSettlementDto
    {
        public long SettlementId { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string TargetMonth { get; set; } = string.Empty;
        public decimal Income { get; set; } = 0;
        public decimal IncomeCash { get; set; } = 0;
        public decimal FeeSplitAmount { get; set; } = 0;
        public decimal TotalCompanyExpense { get; set; } = 0;
        public decimal TotalPersonalExpense { get; set; } = 0;
        public decimal ProfitShareRatio { get; set; }
        public decimal Bonus { get; set; } = 0;
        public decimal FinalAmount { get; set; } = 0;
        public string CalculationVersion { get; set; } = "1.0";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<ExpenseDto> Expenses { get; set; } = new List<ExpenseDto>();
    }

    public class CreateDriverSettlementDto
    {
        public string DriverId { get; set; } = string.Empty;
        public string TargetMonth { get; set; } = string.Empty;
        public decimal ProfitShareRatio { get; set; }
        public List<CreateExpenseDto> CompanyExpenses { get; set; } = new List<CreateExpenseDto>();
        public List<CreateExpenseDto> PersonalExpenses { get; set; } = new List<CreateExpenseDto>();
    }

    public class UpdateDriverSettlementDto
    {
        public decimal ProfitShareRatio { get; set; }
        public List<CreateExpenseDto> CompanyExpenses { get; set; } = new List<CreateExpenseDto>();
        public List<CreateExpenseDto> PersonalExpenses { get; set; } = new List<CreateExpenseDto>();
    }

    public class ExpenseDto
    {
        public long ExpenseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
        public int? ExpenseTypeId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateExpenseDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int? ExpenseTypeId { get; set; }
    }

    public class ExpenseTypeDto
    {
        public int ExpenseTypeId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public decimal? DefaultAmount { get; set; }
        public string? Formula { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class DriverSettlementSummaryDto
    {
        public long SettlementId { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string TargetMonth { get; set; } = string.Empty;
        public decimal Income { get; set; }
        public decimal IncomeCash { get; set; }
        public decimal FeeSplitAmount { get; set; }
        public decimal TotalIncome => Income + IncomeCash;
        public decimal TotalCompanyExpense { get; set; }
        public decimal TotalPersonalExpense { get; set; }
        public decimal ProfitShareRatio { get; set; }
        public decimal Bonus { get; set; }
        public decimal FinalAmount { get; set; }
    }

    public class CreateExpenseTypeDto
    {
        public string Category { get; set; } = string.Empty;       // "company" or "personal"
        public string Name { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public decimal? DefaultAmount { get; set; }
        public string? FormulaType { get; set; }                   // "fixed", "income_percentage", etc.
        public decimal? FormulaValue { get; set; }                 // Percentage value (e.g., 5 for 5%)
    }

    public class UpdateExpenseTypeDto
    {
        public string Name { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public decimal? DefaultAmount { get; set; }
        public string? FormulaType { get; set; }
        public decimal? FormulaValue { get; set; }
    }
}