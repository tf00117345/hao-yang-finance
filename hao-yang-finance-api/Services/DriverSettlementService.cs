using hao_yang_finance_api.Data;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Models;
using Microsoft.EntityFrameworkCore;

namespace hao_yang_finance_api.Services
{
    public class DriverSettlementService
    {
        private readonly ApplicationDbContext _context;

        public DriverSettlementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DriverSettlementSummaryDto>> GetSettlementsAsync(
            string? targetMonth = null
        )
        {
            var query = _context
                .DriverSettlements.Include(ds => ds.Driver)
                .Include(ds => ds.Expenses)
                .AsQueryable();

            if (!string.IsNullOrEmpty(targetMonth))
            {
                query = query.Where(ds => ds.TargetMonth == targetMonth);
            }

            var settlements = await query.ToListAsync();

            return settlements
                .Select(s => new DriverSettlementSummaryDto
                {
                    SettlementId = s.SettlementId,
                    DriverId = s.DriverId,
                    DriverName = s.Driver.Name,
                    TargetMonth = s.TargetMonth,
                    Income = s.Income,
                    IncomeCash = s.IncomeCash,
                    TotalCompanyExpense = s.TotalCompanyExpense,
                    TotalPersonalExpense = s.TotalPersonalExpense,
                    ProfitShareRatio = s.ProfitShareRatio,
                    Bonus = s.Bonus,
                    FinalAmount = s.FinalAmount,
                })
                .ToList();
        }

        public async Task<DriverSettlementDto?> GetSettlementAsync(long settlementId)
        {
            var settlement = await _context
                .DriverSettlements.Include(ds => ds.Driver)
                .Include(ds => ds.Expenses)
                .ThenInclude(e => e.ExpenseType)
                .FirstOrDefaultAsync(ds => ds.SettlementId == settlementId);

            if (settlement == null)
                return null;

            return new DriverSettlementDto
            {
                SettlementId = settlement.SettlementId,
                DriverId = settlement.DriverId,
                DriverName = settlement.Driver.Name,
                TargetMonth = settlement.TargetMonth,
                Income = settlement.Income,
                IncomeCash = settlement.IncomeCash,
                TotalCompanyExpense = settlement.TotalCompanyExpense,
                TotalPersonalExpense = settlement.TotalPersonalExpense,
                ProfitShareRatio = settlement.ProfitShareRatio,
                Bonus = settlement.Bonus,
                FinalAmount = settlement.FinalAmount,
                CalculationVersion = settlement.CalculationVersion,
                CreatedAt = settlement.CreatedAt,
                UpdatedAt = settlement.UpdatedAt,
                Expenses = settlement
                    .Expenses.Select(e => new ExpenseDto
                    {
                        ExpenseId = e.ExpenseId,
                        Name = e.Name,
                        Amount = e.Amount,
                        Category = e.Category,
                        ExpenseTypeId = e.ExpenseTypeId,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt,
                    })
                    .ToList(),
            };
        }

        public async Task<DriverSettlementDto?> GetSettlementByDriverAndMonthAsync(
            string driverId,
            string targetMonth
        )
        {
            // First check if settlement already exists
            var existingSettlement = await _context
                .DriverSettlements.Include(ds => ds.Driver)
                .Include(ds => ds.Expenses)
                .ThenInclude(e => e.ExpenseType)
                .FirstOrDefaultAsync(ds =>
                    ds.DriverId == driverId && ds.TargetMonth == targetMonth
                );

            if (existingSettlement != null)
            {
                // Return existing settlement
                return await GetSettlementAsync(existingSettlement.SettlementId);
            }

            // No existing settlement, calculate from waybills
            var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == driverId);
            if (driver == null)
                return null;

            // Parse target month to DateTime for calculation
            var targetDate = DateTime.ParseExact(targetMonth, "yyyy-MM-dd", null);
            var (invoiceIncome, cashIncome) = await CalculateMonthlyIncomeAsync(
                driverId,
                targetDate
            );

            // Return calculated settlement (not saved to database)
            return new DriverSettlementDto
            {
                SettlementId = 0, // Indicates this is a calculated settlement, not saved
                DriverId = driverId,
                DriverName = driver.Name,
                TargetMonth = targetMonth,
                Income = invoiceIncome,
                IncomeCash = cashIncome,
                TotalCompanyExpense = 0, // No expenses yet
                TotalPersonalExpense = 0, // No expenses yet
                ProfitShareRatio = 0, // Default ratio, user will set this
                Bonus = 0, // Will be calculated when expenses and ratio are set
                FinalAmount = 0, // Will be calculated when expenses and ratio are set
                CalculationVersion = "1.0",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Expenses = new List<ExpenseDto>(), // Empty expenses list
            };
        }

        public async Task<DriverSettlementDto> CreateSettlementAsync(
            CreateDriverSettlementDto createDto,
            string changedBy
        )
        {
            // Check if settlement already exists
            var existingSettlement = await _context.DriverSettlements.FirstOrDefaultAsync(ds =>
                ds.DriverId == createDto.DriverId && ds.TargetMonth == createDto.TargetMonth
            );

            if (existingSettlement != null)
            {
                throw new InvalidOperationException(
                    $"Settlement for driver {createDto.DriverId} in month {createDto.TargetMonth} already exists."
                );
            }

            // Calculate income from waybills - parse the month string to DateTime for calculation
            var targetDate = DateTime.ParseExact(createDto.TargetMonth + "-01", "yyyy-MM-dd", null);
            var (invoiceIncome, cashIncome) = await CalculateMonthlyIncomeAsync(
                createDto.DriverId,
                targetDate
            );

            // Create settlement
            var settlement = new DriverSettlement
            {
                DriverId = createDto.DriverId,
                TargetMonth = createDto.TargetMonth,
                Income = invoiceIncome,
                IncomeCash = cashIncome,
                ProfitShareRatio = createDto.ProfitShareRatio,
                CalculationVersion = "1.0",
            };

            _context.DriverSettlements.Add(settlement);
            await _context.SaveChangesAsync();

            // Create expenses
            var expenses = new List<Expense>();

            // Add company expenses
            foreach (var expenseDto in createDto.CompanyExpenses)
            {
                expenses.Add(
                    new Expense
                    {
                        SettlementId = settlement.SettlementId,
                        ExpenseTypeId = expenseDto.ExpenseTypeId,
                        Name = expenseDto.Name,
                        Amount = expenseDto.Amount,
                        Category = "company",
                    }
                );
            }

            // Add personal expenses
            foreach (var expenseDto in createDto.PersonalExpenses)
            {
                expenses.Add(
                    new Expense
                    {
                        SettlementId = settlement.SettlementId,
                        ExpenseTypeId = expenseDto.ExpenseTypeId,
                        Name = expenseDto.Name,
                        Amount = expenseDto.Amount,
                        Category = "personal",
                    }
                );
            }

            if (expenses.Any())
            {
                _context.Expenses.AddRange(expenses);
                await _context.SaveChangesAsync();
            }

            // Recalculate totals
            settlement = await RecalculateSettlementAsync(settlement.SettlementId);

            return await GetSettlementAsync(settlement.SettlementId)
                ?? throw new InvalidOperationException("Failed to retrieve created settlement");
        }

        public async Task<DriverSettlementDto> UpdateSettlementAsync(
            long settlementId,
            UpdateDriverSettlementDto updateDto,
            string changedBy
        )
        {
            var settlement = await _context
                .DriverSettlements.Include(ds => ds.Expenses)
                .FirstOrDefaultAsync(ds => ds.SettlementId == settlementId);

            if (settlement == null)
                throw new NotFoundException($"Settlement with ID {settlementId} not found");

            // Update profit share ratio
            settlement.ProfitShareRatio = updateDto.ProfitShareRatio;
            settlement.UpdatedAt = DateTime.UtcNow;

            // Remove existing expenses
            _context.Expenses.RemoveRange(settlement.Expenses);

            // Add new expenses
            var expenses = new List<Expense>();

            foreach (var expenseDto in updateDto.CompanyExpenses)
            {
                expenses.Add(
                    new Expense
                    {
                        SettlementId = settlement.SettlementId,
                        ExpenseTypeId = expenseDto.ExpenseTypeId,
                        Name = expenseDto.Name,
                        Amount = expenseDto.Amount,
                        Category = "company",
                    }
                );
            }

            foreach (var expenseDto in updateDto.PersonalExpenses)
            {
                expenses.Add(
                    new Expense
                    {
                        SettlementId = settlement.SettlementId,
                        ExpenseTypeId = expenseDto.ExpenseTypeId,
                        Name = expenseDto.Name,
                        Amount = expenseDto.Amount,
                        Category = "personal",
                    }
                );
            }

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            // Recalculate totals
            settlement = await RecalculateSettlementAsync(settlementId);

            return await GetSettlementAsync(settlementId)
                ?? throw new InvalidOperationException("Failed to retrieve updated settlement");
        }

        public async Task<bool> DeleteSettlementAsync(long settlementId, string changedBy)
        {
            var settlement = await _context.DriverSettlements.FirstOrDefaultAsync(ds =>
                ds.SettlementId == settlementId
            );

            if (settlement == null)
                return false;

            _context.DriverSettlements.Remove(settlement);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ExpenseTypeDto>> GetExpenseTypesAsync(string? category = null)
        {
            var query = _context.ExpenseTypes.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(et => et.Category == category);
            }

            var expenseTypes = await query.OrderBy(et => et.Name).ToListAsync();

            return expenseTypes
                .Select(et => new ExpenseTypeDto
                {
                    ExpenseTypeId = et.ExpenseTypeId,
                    Category = et.Category,
                    Name = et.Name,
                    IsDefault = et.IsDefault,
                    DefaultAmount = et.DefaultAmount,
                    Formula = et.Formula,
                    CreatedAt = et.CreatedAt,
                })
                .ToList();
        }

        public async Task<List<ExpenseTypeDto>> GetDefaultExpenseTypesAsync(string category)
        {
            return await GetExpenseTypesAsync(category);
        }

        public async Task<ExpenseTypeDto?> GetExpenseTypeByIdAsync(int expenseTypeId)
        {
            var expenseType = await _context.ExpenseTypes.FirstOrDefaultAsync(et =>
                et.ExpenseTypeId == expenseTypeId
            );

            if (expenseType == null)
                return null;

            return new ExpenseTypeDto
            {
                ExpenseTypeId = expenseType.ExpenseTypeId,
                Category = expenseType.Category,
                Name = expenseType.Name,
                IsDefault = expenseType.IsDefault,
                DefaultAmount = expenseType.DefaultAmount,
                Formula = expenseType.Formula,
                CreatedAt = expenseType.CreatedAt,
            };
        }

        public async Task<ExpenseTypeDto> CreateExpenseTypeAsync(
            CreateExpenseTypeDto createDto,
            string changedBy
        )
        {
            // Check if expense type with same name and category already exists
            var existing = await _context.ExpenseTypes.FirstOrDefaultAsync(et =>
                et.Name == createDto.Name && et.Category == createDto.Category
            );

            if (existing != null)
            {
                throw new InvalidOperationException(
                    $"Expense type '{createDto.Name}' in category '{createDto.Category}' already exists."
                );
            }

            var formula = ConvertFormulaTypeToFormula(
                createDto.FormulaType,
                createDto.FormulaValue
            );

            var expenseType = new ExpenseType
            {
                Category = createDto.Category,
                Name = createDto.Name,
                IsDefault = createDto.IsDefault,
                DefaultAmount = createDto.DefaultAmount,
                Formula = formula,
                CreatedAt = DateTime.UtcNow,
            };

            _context.ExpenseTypes.Add(expenseType);
            await _context.SaveChangesAsync();

            return await GetExpenseTypeByIdAsync(expenseType.ExpenseTypeId)
                ?? throw new InvalidOperationException("Failed to retrieve created expense type");
        }

        public async Task<ExpenseTypeDto> UpdateExpenseTypeAsync(
            int expenseTypeId,
            UpdateExpenseTypeDto updateDto,
            string changedBy
        )
        {
            var expenseType = await _context.ExpenseTypes.FirstOrDefaultAsync(et =>
                et.ExpenseTypeId == expenseTypeId
            );

            if (expenseType == null)
                throw new NotFoundException($"Expense type with ID {expenseTypeId} not found");

            // Check if name conflict (same name and category but different ID)
            var conflict = await _context.ExpenseTypes.FirstOrDefaultAsync(et =>
                et.Name == updateDto.Name
                && et.Category == expenseType.Category
                && et.ExpenseTypeId != expenseTypeId
            );

            if (conflict != null)
            {
                throw new InvalidOperationException(
                    $"Expense type '{updateDto.Name}' in category '{expenseType.Category}' already exists."
                );
            }

            var formula = ConvertFormulaTypeToFormula(
                updateDto.FormulaType,
                updateDto.FormulaValue
            );

            expenseType.Name = updateDto.Name;
            expenseType.IsDefault = updateDto.IsDefault;
            expenseType.DefaultAmount = updateDto.DefaultAmount;
            expenseType.Formula = formula;

            await _context.SaveChangesAsync();

            return await GetExpenseTypeByIdAsync(expenseTypeId)
                ?? throw new InvalidOperationException("Failed to retrieve updated expense type");
        }

        public async Task<bool> DeleteExpenseTypeAsync(int expenseTypeId, string changedBy)
        {
            var expenseType = await _context.ExpenseTypes.FirstOrDefaultAsync(et =>
                et.ExpenseTypeId == expenseTypeId
            );

            if (expenseType == null)
                return false;

            // Check if expense type is being used by any expenses
            var isUsed = await _context.Expenses.AnyAsync(e => e.ExpenseTypeId == expenseTypeId);

            if (isUsed)
            {
                throw new InvalidOperationException(
                    $"Cannot delete expense type '{expenseType.Name}' because it is being used in settlements."
                );
            }

            _context.ExpenseTypes.Remove(expenseType);
            await _context.SaveChangesAsync();

            return true;
        }

        private string? ConvertFormulaTypeToFormula(string? formulaType, decimal? formulaValue)
        {
            if (string.IsNullOrEmpty(formulaType) || formulaType == "fixed")
                return null;

            if (!formulaValue.HasValue)
                return null;

            // Convert percentage to decimal (e.g., 5 -> 0.05)
            var decimalValue = formulaValue.Value / 100;

            return formulaType switch
            {
                "income_percentage" => $"income * {decimalValue}",
                "income_cash_percentage" => $"income_cash * {decimalValue}",
                "total_income_percentage" => $"(income + income_cash) * {decimalValue}",
                _ => null,
            };
        }

        private async Task<(decimal invoiceIncome, decimal cashIncome)> CalculateMonthlyIncomeAsync(
            string driverId,
            DateTime targetMonth
        )
        {
            var monthStart = $"{targetMonth.Year:D4}-{targetMonth.Month:D2}-01";
            var nextMonth = targetMonth.AddMonths(1);
            var monthEnd = $"{nextMonth.Year:D4}-{nextMonth.Month:D2}-01";

            // Get waybills for the month
            var waybills = await _context
                .Waybills.Where(w =>
                    w.DriverId == driverId
                    && w.Date.CompareTo(monthStart) >= 0
                    && w.Date.CompareTo(monthEnd) < 0
                )
                .ToListAsync();

            var invoiceIncome = waybills
                .Where(w => w.Status == WaybillStatus.INVOICED.ToString() || w.Status == WaybillStatus.PENDING.ToString())
                .Sum(w => w.Fee);

            var cashIncome = waybills
                .Where(w =>
                    w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString()
                    || w.Status == WaybillStatus.NEED_TAX_UNPAID.ToString()
                    || w.Status == WaybillStatus.NEED_TAX_PAID.ToString()
                )
                .Sum(w => w.Fee);

            return (invoiceIncome, cashIncome);
        }

        private async Task<DriverSettlement> RecalculateSettlementAsync(long settlementId)
        {
            var settlement = await _context
                .DriverSettlements.Include(ds => ds.Expenses)
                .FirstOrDefaultAsync(ds => ds.SettlementId == settlementId);

            if (settlement == null)
                throw new NotFoundException($"Settlement with ID {settlementId} not found");

            // Calculate totals
            settlement.TotalCompanyExpense = settlement
                .Expenses.Where(e => e.Category == "company")
                .Sum(e => e.Amount);

            settlement.TotalPersonalExpense = settlement
                .Expenses.Where(e => e.Category == "personal")
                .Sum(e => e.Amount);

            // Calculate bonus: (Total Income - Company Expenses - Personal Expenses) × Profit Share Ratio / 100
            var totalIncome = settlement.Income + settlement.IncomeCash;
            var profitableAmount =
                totalIncome - settlement.TotalCompanyExpense - settlement.TotalPersonalExpense;
            settlement.Bonus = profitableAmount * (settlement.ProfitShareRatio / 100);

            // Calculate final amount: Bonus + Personal Expenses - Cash Income
            settlement.FinalAmount =
                settlement.Bonus + settlement.TotalPersonalExpense - settlement.IncomeCash;

            settlement.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return settlement;
        }
    }

    public class NotFoundException : Exception
    {
        public NotFoundException(string message)
            : base(message) { }
    }
}
