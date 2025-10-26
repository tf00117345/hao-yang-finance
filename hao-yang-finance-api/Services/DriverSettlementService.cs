using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;

namespace hao_yang_finance_api.Services
{
    public class DriverSettlementService
    {
        private readonly ApplicationDbContext _context;

        public DriverSettlementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DriverSettlementSummaryDto>> GetSettlementsAsync(string? targetMonth = null)
        {
            var query = _context.DriverSettlements
                .Include(ds => ds.Driver)
                .Include(ds => ds.Expenses)
                .AsQueryable();

            if (!string.IsNullOrEmpty(targetMonth))
            {
                query = query.Where(ds => ds.TargetMonth == targetMonth);
            }

            var settlements = await query.ToListAsync();

            return settlements.Select(s => new DriverSettlementSummaryDto
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
                FinalAmount = s.FinalAmount
            }).ToList();
        }

        public async Task<DriverSettlementDto?> GetSettlementAsync(long settlementId)
        {
            var settlement = await _context.DriverSettlements
                .Include(ds => ds.Driver)
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
                Expenses = settlement.Expenses.Select(e => new ExpenseDto
                {
                    ExpenseId = e.ExpenseId,
                    Name = e.Name,
                    Amount = e.Amount,
                    Category = e.Category,
                    ExpenseTypeId = e.ExpenseTypeId,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                }).ToList()
            };
        }

        public async Task<DriverSettlementDto?> GetSettlementByDriverAndMonthAsync(string driverId, string targetMonth)
        {
            // First check if settlement already exists
            var existingSettlement = await _context.DriverSettlements
                .Include(ds => ds.Driver)
                .Include(ds => ds.Expenses)
                .ThenInclude(e => e.ExpenseType)
                .FirstOrDefaultAsync(ds => ds.DriverId == driverId && ds.TargetMonth == targetMonth);

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
            var (invoiceIncome, cashIncome) = await CalculateMonthlyIncomeAsync(driverId, targetDate);

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
                Expenses = new List<ExpenseDto>() // Empty expenses list
            };
        }

        public async Task<DriverSettlementDto> CreateSettlementAsync(CreateDriverSettlementDto createDto,
            string changedBy)
        {
            // Check if settlement already exists
            var existingSettlement = await _context.DriverSettlements
                .FirstOrDefaultAsync(ds =>
                    ds.DriverId == createDto.DriverId && ds.TargetMonth == createDto.TargetMonth);

            if (existingSettlement != null)
            {
                throw new InvalidOperationException(
                    $"Settlement for driver {createDto.DriverId} in month {createDto.TargetMonth} already exists.");
            }

            // Calculate income from waybills - parse the month string to DateTime for calculation
            var targetDate = DateTime.ParseExact(createDto.TargetMonth + "-01", "yyyy-MM-dd", null);
            var (invoiceIncome, cashIncome) = await CalculateMonthlyIncomeAsync(createDto.DriverId, targetDate);

            // Create settlement
            var settlement = new DriverSettlement
            {
                DriverId = createDto.DriverId,
                TargetMonth = createDto.TargetMonth,
                Income = invoiceIncome,
                IncomeCash = cashIncome,
                ProfitShareRatio = createDto.ProfitShareRatio,
                CalculationVersion = "1.0"
            };

            _context.DriverSettlements.Add(settlement);
            await _context.SaveChangesAsync();

            // Create expenses
            var expenses = new List<Expense>();

            // Add company expenses
            foreach (var expenseDto in createDto.CompanyExpenses)
            {
                expenses.Add(new Expense
                {
                    SettlementId = settlement.SettlementId,
                    ExpenseTypeId = expenseDto.ExpenseTypeId,
                    Name = expenseDto.Name,
                    Amount = expenseDto.Amount,
                    Category = "company"
                });
            }

            // Add personal expenses
            foreach (var expenseDto in createDto.PersonalExpenses)
            {
                expenses.Add(new Expense
                {
                    SettlementId = settlement.SettlementId,
                    ExpenseTypeId = expenseDto.ExpenseTypeId,
                    Name = expenseDto.Name,
                    Amount = expenseDto.Amount,
                    Category = "personal"
                });
            }

            if (expenses.Any())
            {
                _context.Expenses.AddRange(expenses);
                await _context.SaveChangesAsync();
            }

            // Recalculate totals
            settlement = await RecalculateSettlementAsync(settlement.SettlementId);

            return await GetSettlementAsync(settlement.SettlementId) ??
                   throw new InvalidOperationException("Failed to retrieve created settlement");
        }

        public async Task<DriverSettlementDto> UpdateSettlementAsync(long settlementId,
            UpdateDriverSettlementDto updateDto, string changedBy)
        {
            var settlement = await _context.DriverSettlements
                .Include(ds => ds.Expenses)
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
                expenses.Add(new Expense
                {
                    SettlementId = settlement.SettlementId,
                    ExpenseTypeId = expenseDto.ExpenseTypeId,
                    Name = expenseDto.Name,
                    Amount = expenseDto.Amount,
                    Category = "company"
                });
            }

            foreach (var expenseDto in updateDto.PersonalExpenses)
            {
                expenses.Add(new Expense
                {
                    SettlementId = settlement.SettlementId,
                    ExpenseTypeId = expenseDto.ExpenseTypeId,
                    Name = expenseDto.Name,
                    Amount = expenseDto.Amount,
                    Category = "personal"
                });
            }

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            // Recalculate totals
            settlement = await RecalculateSettlementAsync(settlementId);

            return await GetSettlementAsync(settlementId) ??
                   throw new InvalidOperationException("Failed to retrieve updated settlement");
        }

        public async Task<bool> DeleteSettlementAsync(long settlementId, string changedBy)
        {
            var settlement = await _context.DriverSettlements
                .FirstOrDefaultAsync(ds => ds.SettlementId == settlementId);

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

            return expenseTypes.Select(et => new ExpenseTypeDto
            {
                ExpenseTypeId = et.ExpenseTypeId,
                Category = et.Category,
                Name = et.Name,
                IsDefault = et.IsDefault,
                DefaultAmount = et.DefaultAmount,
                Formula = et.Formula,
                CreatedAt = et.CreatedAt
            }).ToList();
        }

        public async Task<List<ExpenseTypeDto>> GetDefaultExpenseTypesAsync(string category)
        {
            return await GetExpenseTypesAsync(category);
        }

        private async Task<(decimal invoiceIncome, decimal cashIncome)> CalculateMonthlyIncomeAsync(string driverId,
            DateTime targetMonth)
        {
            var monthStart = $"{targetMonth.Year:D4}-{targetMonth.Month:D2}-01";
            var nextMonth = targetMonth.AddMonths(1);
            var monthEnd = $"{nextMonth.Year:D4}-{nextMonth.Month:D2}-01";

            // Get waybills for the month
            var waybills = await _context.Waybills
                .Where(w => w.DriverId == driverId
                            && w.Date.CompareTo(monthStart) >= 0
                            && w.Date.CompareTo(monthEnd) < 0)
                .ToListAsync();

            var invoiceIncome = waybills
                .Where(w => w.Status is "INVOICED" or "PENDING")
                .Sum(w => w.Fee);

            var cashIncome = waybills
                .Where(w => w.Status is "NO_INVOICE_NEEDED" or "PENDING_PAYMENT")
                .Sum(w => w.Fee);

            return (invoiceIncome, cashIncome);
        }

        private async Task<DriverSettlement> RecalculateSettlementAsync(long settlementId)
        {
            var settlement = await _context.DriverSettlements
                .Include(ds => ds.Expenses)
                .FirstOrDefaultAsync(ds => ds.SettlementId == settlementId);

            if (settlement == null)
                throw new NotFoundException($"Settlement with ID {settlementId} not found");

            // Calculate totals
            settlement.TotalCompanyExpense = settlement.Expenses
                .Where(e => e.Category == "company")
                .Sum(e => e.Amount);

            settlement.TotalPersonalExpense = settlement.Expenses
                .Where(e => e.Category == "personal")
                .Sum(e => e.Amount);

            // Calculate bonus: (Total Income - Company Expenses - Personal Expenses) × Profit Share Ratio / 100
            var totalIncome = settlement.Income + settlement.IncomeCash;
            var profitableAmount = totalIncome - settlement.TotalCompanyExpense - settlement.TotalPersonalExpense;
            settlement.Bonus = profitableAmount * (settlement.ProfitShareRatio / 100);

            // Calculate final amount: Bonus + Personal Expenses - Cash Income
            settlement.FinalAmount = settlement.Bonus + settlement.TotalPersonalExpense - settlement.IncomeCash;

            settlement.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return settlement;
        }
    }

    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message)
        {
        }
    }
}