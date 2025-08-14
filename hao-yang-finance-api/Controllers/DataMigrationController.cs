using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataMigrationController : ControllerBase
    {
        private readonly ILogger<DataMigrationController> _logger;

        public DataMigrationController(ILogger<DataMigrationController> logger)
        {
            _logger = logger;
        }

        [HttpPost("migrate")]
        public async Task<IActionResult> MigrateData()
        {
            try
            {
                _logger.LogInformation("開始數據遷移...");

                // SQLite connection
                var sqliteOptionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                sqliteOptionsBuilder.UseSqlite("Data Source=hao-yang-finance.db");
                
                // PostgreSQL connection
                var postgresOptionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                postgresOptionsBuilder.UseNpgsql("Host=localhost;Database=hao_yang_finance;Username=postgres;Password=admin");

                using var sqliteContext = new ApplicationDbContext(sqliteOptionsBuilder.Options);
                using var postgresContext = new ApplicationDbContext(postgresOptionsBuilder.Options);

                var migrationResults = new List<string>();

                // 測試連接
                _logger.LogInformation("測試SQLite連接...");
                await sqliteContext.Database.CanConnectAsync();
                migrationResults.Add("SQLite連接成功");

                _logger.LogInformation("測試PostgreSQL連接...");
                await postgresContext.Database.CanConnectAsync();
                migrationResults.Add("PostgreSQL連接成功");

                // 遷移數據
                migrationResults.AddRange(await MigrateUsers(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateCompanies(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateDrivers(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateWaybills(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateInvoices(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateExtraExpenses(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateLoadingLocations(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateInvoiceWaybills(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateInvoiceExtraExpenses(sqliteContext, postgresContext));
                migrationResults.AddRange(await MigrateCompanyPhones(sqliteContext, postgresContext));

                migrationResults.Add("數據遷移完成！");
                _logger.LogInformation("數據遷移完成！");

                return Ok(new { success = true, results = migrationResults });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "遷移過程中發生錯誤");
                return BadRequest(new { success = false, error = ex.Message, details = ex.ToString() });
            }
        }

        private async Task<List<string>> MigrateUsers(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移用戶數據...");
                var users = await source.Users.ToListAsync();
                if (users.Any())
                {
                    target.Users.AddRange(users);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {users.Count} 個用戶";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有用戶數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移用戶數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateCompanies(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移公司數據...");
                var companies = await source.Companies.ToListAsync();
                if (companies.Any())
                {
                    target.Companies.AddRange(companies);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {companies.Count} 家公司";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有公司數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移公司數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateDrivers(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移司機數據...");
                var drivers = await source.Drivers.ToListAsync();
                if (drivers.Any())
                {
                    target.Drivers.AddRange(drivers);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {drivers.Count} 個司機";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有司機數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移司機數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateWaybills(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移託運單數據...");
                var waybills = await source.Waybills.ToListAsync();
                if (waybills.Any())
                {
                    target.Waybills.AddRange(waybills);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {waybills.Count} 個託運單";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有託運單數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移託運單數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateInvoices(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移發票數據...");
                var invoices = await source.Invoices.ToListAsync();
                if (invoices.Any())
                {
                    target.Invoices.AddRange(invoices);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {invoices.Count} 張發票";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有發票數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移發票數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateExtraExpenses(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移額外費用數據...");
                var extraExpenses = await source.ExtraExpenses.ToListAsync();
                if (extraExpenses.Any())
                {
                    target.ExtraExpenses.AddRange(extraExpenses);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {extraExpenses.Count} 個額外費用";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有額外費用數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移額外費用數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateLoadingLocations(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移載貨地點數據...");
                var loadingLocations = await source.LoadingLocations.ToListAsync();
                if (loadingLocations.Any())
                {
                    target.LoadingLocations.AddRange(loadingLocations);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {loadingLocations.Count} 個載貨地點";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有載貨地點數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移載貨地點數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateInvoiceWaybills(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移發票託運單關聯數據...");
                var invoiceWaybills = await source.InvoiceWaybills.ToListAsync();
                if (invoiceWaybills.Any())
                {
                    target.InvoiceWaybills.AddRange(invoiceWaybills);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {invoiceWaybills.Count} 個發票託運單關聯";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有發票託運單關聯數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移發票託運單關聯數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateInvoiceExtraExpenses(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移發票額外費用關聯數據...");
                var invoiceExtraExpenses = await source.InvoiceExtraExpenses.ToListAsync();
                if (invoiceExtraExpenses.Any())
                {
                    target.InvoiceExtraExpenses.AddRange(invoiceExtraExpenses);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {invoiceExtraExpenses.Count} 個發票額外費用關聯";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有發票額外費用關聯數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移發票額外費用關聯數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }

        private async Task<List<string>> MigrateCompanyPhones(ApplicationDbContext source, ApplicationDbContext target)
        {
            var results = new List<string>();
            try
            {
                _logger.LogInformation("遷移公司電話數據...");
                var companyPhones = await source.CompanyPhones.ToListAsync();
                if (companyPhones.Any())
                {
                    target.CompanyPhones.AddRange(companyPhones);
                    await target.SaveChangesAsync();
                    var message = $"成功遷移 {companyPhones.Count} 個公司電話";
                    results.Add(message);
                    _logger.LogInformation(message);
                }
                else
                {
                    results.Add("沒有公司電話數據需要遷移");
                }
            }
            catch (Exception ex)
            {
                var error = $"遷移公司電話數據失敗: {ex.Message}";
                results.Add(error);
                _logger.LogError(ex, error);
            }
            return results;
        }
    }
}