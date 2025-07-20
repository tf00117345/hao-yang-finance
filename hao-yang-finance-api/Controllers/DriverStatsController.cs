using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.DTOs;

namespace hao_yang_finance_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DriverStatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DriverStatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DriverStats
        [HttpGet]
        public async Task<ActionResult<DriverStatsSummaryDto>> GetDriverStats(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? driverId,
            [FromQuery] bool includeMonthlyBreakdown = false,
            [FromQuery] int topDriversCount = 10)
        {
            var query = _context.Waybills
                .Include(w => w.Driver)
                .Where(w => w.Driver != null)
                .AsQueryable();

            // 日期範圍篩選
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                var startDateString = start.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(startDateString) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                var endDateString = end.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(endDateString) <= 0);
            }

            // 司機篩選
            if (!string.IsNullOrEmpty(driverId))
            {
                query = query.Where(w => w.DriverId == driverId);
            }

            var waybills = await query.ToListAsync();

            // 按司機分組統計
            var driverGroups = waybills
                .Where(w => w.Driver != null)
                .GroupBy(w => new { w.DriverId, w.Driver!.Name })
                .ToList();

            var driverStats = new List<DriverStatsDto>();

            foreach (var group in driverGroups)
            {
                var driverWaybills = group.ToList();
                var totalRevenue = driverWaybills.Sum(w => w.Fee);
                var waybillDates = driverWaybills.Select(w => w.Date).Where(d => !string.IsNullOrEmpty(d)).ToList();

                var stats = new DriverStatsDto
                {
                    DriverId = group.Key.DriverId!,
                    DriverName = group.Key.Name ?? "",
                    TotalWaybills = driverWaybills.Count,
                    PendingWaybills = driverWaybills.Count(w => w.Status == "PENDING"),
                    InvoicedWaybills = driverWaybills.Count(w => w.Status == "INVOICED"),
                    NoInvoiceNeededWaybills = driverWaybills.Count(w => w.Status == "NO_INVOICE_NEEDED"),
                    TotalRevenue = totalRevenue,
                    PendingRevenue = driverWaybills.Where(w => w.Status == "PENDING").Sum(w => w.Fee),
                    InvoicedRevenue = driverWaybills.Where(w => w.Status == "INVOICED").Sum(w => w.Fee),
                    NoInvoiceNeededRevenue = driverWaybills.Where(w => w.Status == "NO_INVOICE_NEEDED").Sum(w => w.Fee),
                    AverageWaybillFee = driverWaybills.Count > 0 ? totalRevenue / driverWaybills.Count : 0,
                    FirstWaybillDate = waybillDates.Any() ? waybillDates.Min() : "",
                    LastWaybillDate = waybillDates.Any() ? waybillDates.Max() : ""
                };

                // 月度統計
                if (includeMonthlyBreakdown)
                {
                    var monthlyGroups = driverWaybills
                        .Where(w => !string.IsNullOrEmpty(w.Date) && w.Date.Length >= 7)
                        .GroupBy(w => w.Date[..7]) // YYYY-MM
                        .OrderBy(g => g.Key)
                        .ToList();

                    stats.MonthlyStats = monthlyGroups.Select(mg => new MonthlyStatsDto
                    {
                        Month = mg.Key,
                        WaybillCount = mg.Count(),
                        Revenue = mg.Sum(w => w.Fee),
                        AverageFee = mg.Count() > 0 ? mg.Sum(w => w.Fee) / mg.Count() : 0
                    }).ToList();
                }

                driverStats.Add(stats);
            }

            // 排序：按總收入降序
            driverStats = driverStats.OrderByDescending(d => d.TotalRevenue).ToList();

            // 取得前幾名司機
            var topDrivers = driverStats.Take(topDriversCount).ToList();

            // 計算總體統計
            var totalDrivers = await _context.Drivers.CountAsync(d => d.IsActive);
            var activeDrivers = driverStats.Count;
            var allDriversTotalRevenue = driverStats.Sum(d => d.TotalRevenue);
            var totalWaybillCount = driverStats.Sum(d => d.TotalWaybills);

            var summary = new DriverStatsSummaryDto
            {
                TotalDrivers = totalDrivers,
                ActiveDrivers = activeDrivers,
                TotalRevenue = allDriversTotalRevenue,
                AverageRevenuePerDriver = activeDrivers > 0 ? allDriversTotalRevenue / activeDrivers : 0,
                TotalWaybills = totalWaybillCount,
                AverageWaybillsPerDriver = activeDrivers > 0 ? (decimal)totalWaybillCount / activeDrivers : 0,
                TopDrivers = topDrivers,
                AllDrivers = driverStats
            };

            return Ok(summary);
        }

        // GET: api/DriverStats/{driverId}
        [HttpGet("{driverId}")]
        public async Task<ActionResult<DriverStatsDto>> GetDriverStatsById(
            string driverId,
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] bool includeMonthlyBreakdown = true)
        {
            // 驗證司機存在
            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver == null)
            {
                return NotFound(new { message = "找不到指定的司機" });
            }

            var query = _context.Waybills
                .Where(w => w.DriverId == driverId)
                .AsQueryable();

            // 日期範圍篩選
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                var startDateString = start.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(startDateString) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                var endDateString = end.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(endDateString) <= 0);
            }

            var waybills = await query.ToListAsync();
            var totalRevenue = waybills.Sum(w => w.Fee);
            var waybillDates = waybills.Select(w => w.Date).Where(d => !string.IsNullOrEmpty(d)).ToList();

            var stats = new DriverStatsDto
            {
                DriverId = driverId,
                DriverName = driver.Name ?? "",
                TotalWaybills = waybills.Count,
                PendingWaybills = waybills.Count(w => w.Status == "PENDING"),
                InvoicedWaybills = waybills.Count(w => w.Status == "INVOICED"),
                NoInvoiceNeededWaybills = waybills.Count(w => w.Status == "NO_INVOICE_NEEDED"),
                TotalRevenue = totalRevenue,
                PendingRevenue = waybills.Where(w => w.Status == "PENDING").Sum(w => w.Fee),
                InvoicedRevenue = waybills.Where(w => w.Status == "INVOICED").Sum(w => w.Fee),
                NoInvoiceNeededRevenue = waybills.Where(w => w.Status == "NO_INVOICE_NEEDED").Sum(w => w.Fee),
                AverageWaybillFee = waybills.Count > 0 ? totalRevenue / waybills.Count : 0,
                FirstWaybillDate = waybillDates.Any() ? waybillDates.Min() : "",
                LastWaybillDate = waybillDates.Any() ? waybillDates.Max() : ""
            };

            // 月度統計
            if (includeMonthlyBreakdown)
            {
                var monthlyGroups = waybills
                    .Where(w => !string.IsNullOrEmpty(w.Date) && w.Date.Length >= 7)
                    .GroupBy(w => w.Date[..7]) // YYYY-MM
                    .OrderBy(g => g.Key)
                    .ToList();

                stats.MonthlyStats = monthlyGroups.Select(mg => new MonthlyStatsDto
                {
                    Month = mg.Key,
                    WaybillCount = mg.Count(),
                    Revenue = mg.Sum(w => w.Fee),
                    AverageFee = mg.Count() > 0 ? mg.Sum(w => w.Fee) / mg.Count() : 0
                }).ToList();
            }

            return Ok(stats);
        }

        // GET: api/DriverStats/summary
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetDriverStatsSummary(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate)
        {
            var query = _context.Waybills
                .Include(w => w.Driver)
                .Where(w => w.Driver != null)
                .AsQueryable();

            // 日期範圍篩選
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                var startDateString = start.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(startDateString) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                var endDateString = end.ToString("yyyy-MM-dd");
                query = query.Where(w => w.Date.CompareTo(endDateString) <= 0);
            }

            var waybills = await query.ToListAsync();

            // 總體統計
            var totalWaybills = waybills.Count;
            var totalRevenue = waybills.Sum(w => w.Fee);
            var activeDriversCount = waybills.Select(w => w.DriverId).Distinct().Count();
            
            // 狀態統計
            var pendingCount = waybills.Count(w => w.Status == "PENDING");
            var invoicedCount = waybills.Count(w => w.Status == "INVOICED");
            var noInvoiceCount = waybills.Count(w => w.Status == "NO_INVOICE_NEEDED");

            var pendingRevenue = waybills.Where(w => w.Status == "PENDING").Sum(w => w.Fee);
            var invoicedRevenue = waybills.Where(w => w.Status == "INVOICED").Sum(w => w.Fee);
            var noInvoiceRevenue = waybills.Where(w => w.Status == "NO_INVOICE_NEEDED").Sum(w => w.Fee);

            var summary = new
            {
                TotalWaybills = totalWaybills,
                TotalRevenue = totalRevenue,
                ActiveDrivers = activeDriversCount,
                AverageRevenuePerDriver = activeDriversCount > 0 ? totalRevenue / activeDriversCount : 0,
                AverageWaybillFee = totalWaybills > 0 ? totalRevenue / totalWaybills : 0,
                StatusBreakdown = new
                {
                    Pending = new { Count = pendingCount, Revenue = pendingRevenue },
                    Invoiced = new { Count = invoicedCount, Revenue = invoicedRevenue },
                    NoInvoiceNeeded = new { Count = noInvoiceCount, Revenue = noInvoiceRevenue }
                }
            };

            return Ok(summary);
        }
    }
}