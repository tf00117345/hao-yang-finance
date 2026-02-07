using hao_yang_finance_api.Attributes;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace hao_yang_finance_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DriverStatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DriverStatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DriverStats
        [HttpGet]
        [RequirePermission(Permission.StatisticsRead)]
        public async Task<ActionResult<DriverStatsSummaryDto>> GetDriverStats(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? driverId,
            [FromQuery] bool includeMonthlyBreakdown = false,
            [FromQuery] int topDriversCount = 10
        )
        {
            var query = _context
                .Waybills.Include(w => w.Driver)
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

            // 載入費用分攤資料
            var waybillIds = waybills.Select(w => w.Id).ToList();
            var outgoingSplits = await _context.WaybillFeeSplits
                .Where(fs => waybillIds.Contains(fs.WaybillId))
                .ToListAsync();

            // 載入所有日期範圍內的入帳分攤（其他司機的託運單分攤給查詢中的司機）
            var incomingSplitsQuery = _context.WaybillFeeSplits
                .Include(fs => fs.Waybill)
                .Include(fs => fs.TargetDriver)
                .AsQueryable();

            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var splitStart))
            {
                var splitStartStr = splitStart.ToString("yyyy-MM-dd");
                incomingSplitsQuery = incomingSplitsQuery.Where(fs => fs.Waybill.Date.CompareTo(splitStartStr) >= 0);
            }
            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var splitEnd))
            {
                var splitEndStr = splitEnd.ToString("yyyy-MM-dd");
                incomingSplitsQuery = incomingSplitsQuery.Where(fs => fs.Waybill.Date.CompareTo(splitEndStr) <= 0);
            }

            var allIncomingSplits = await incomingSplitsQuery.ToListAsync();

            // 按出帳託運單分組
            var outgoingSplitsByWaybill = outgoingSplits
                .GroupBy(fs => fs.WaybillId)
                .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));

            // 按目標司機分組入帳分攤
            var incomingSplitsByDriver = allIncomingSplits
                .GroupBy(fs => fs.TargetDriverId)
                .ToDictionary(g => g.Key, g => g.ToList());

            // 按司機分組統計
            var driverGroups = waybills
                .Where(w => w.Driver != null)
                .GroupBy(w => new { w.DriverId, w.Driver!.Name })
                .ToList();

            var driverStats = new List<DriverStatsDto>();

            foreach (var group in driverGroups)
            {
                var currentDriverId = group.Key.DriverId!;
                var driverWaybills = group.ToList();

                // 計算扣除出帳分攤後的收入
                var invoicedRevenue = driverWaybills
                    .Where(w => w.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(w => w.Fee - outgoingSplitsByWaybill.GetValueOrDefault(w.Id, 0));
                var noInvoiceRevenue = driverWaybills
                    .Where(w => w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(w => w.Fee - outgoingSplitsByWaybill.GetValueOrDefault(w.Id, 0));

                // 加入入帳分攤收入
                if (incomingSplitsByDriver.TryGetValue(currentDriverId, out var incomingSplits))
                {
                    invoicedRevenue += incomingSplits
                        .Where(fs => fs.Waybill.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString())
                        .Sum(fs => fs.Amount);
                    noInvoiceRevenue += incomingSplits
                        .Where(fs => fs.Waybill.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                        .Sum(fs => fs.Amount);
                }

                var totalRevenue = invoicedRevenue + noInvoiceRevenue;
                var waybillDates = driverWaybills
                    .Select(w => w.Date)
                    .Where(d => !string.IsNullOrEmpty(d))
                    .ToList();

                var stats = new DriverStatsDto
                {
                    DriverId = currentDriverId,
                    DriverName = group.Key.Name ?? "",
                    TotalWaybills = driverWaybills.Count,
                    InvoicedWaybills = driverWaybills.Count(w =>
                        w.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString()
                    ),
                    NoInvoiceNeededWaybills = driverWaybills.Count(w =>
                        w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString()
                    ),
                    TotalRevenue = totalRevenue,
                    InvoicedRevenue = invoicedRevenue,
                    NoInvoiceNeededRevenue = noInvoiceRevenue,
                    AverageWaybillFee =
                        driverWaybills.Count > 0 ? totalRevenue / driverWaybills.Count : 0,
                    FirstWaybillDate = waybillDates.Any() ? waybillDates.Min() : "",
                    LastWaybillDate = waybillDates.Any() ? waybillDates.Max() : "",
                };

                // 月度統計
                if (includeMonthlyBreakdown)
                {
                    // 出帳分攤按月分組
                    var outgoingSplitsByMonth = outgoingSplits
                        .Where(fs => driverWaybills.Any(w => w.Id == fs.WaybillId))
                        .GroupBy(fs =>
                        {
                            var waybill = driverWaybills.First(w => w.Id == fs.WaybillId);
                            return waybill.Date.Length >= 7 ? waybill.Date[..7] : "";
                        })
                        .Where(g => !string.IsNullOrEmpty(g.Key))
                        .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));

                    // 入帳分攤按月分組
                    var incomingSplitsByMonth = new Dictionary<string, decimal>();
                    if (incomingSplitsByDriver.TryGetValue(currentDriverId, out var driverIncoming))
                    {
                        incomingSplitsByMonth = driverIncoming
                            .Where(fs => !string.IsNullOrEmpty(fs.Waybill.Date) && fs.Waybill.Date.Length >= 7)
                            .GroupBy(fs => fs.Waybill.Date[..7])
                            .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));
                    }

                    var monthlyGroups = driverWaybills
                        .Where(w => !string.IsNullOrEmpty(w.Date) && w.Date.Length >= 7)
                        .GroupBy(w => w.Date[..7]) // YYYY-MM
                        .OrderBy(g => g.Key)
                        .ToList();

                    // 收集所有相關月份（包含只有入帳分攤的月份）
                    var allMonths = monthlyGroups.Select(g => g.Key)
                        .Union(incomingSplitsByMonth.Keys)
                        .OrderBy(m => m)
                        .Distinct()
                        .ToList();

                    stats.MonthlyStats = allMonths
                        .Select(month =>
                        {
                            var monthWaybills = monthlyGroups
                                .FirstOrDefault(g => g.Key == month)?
                                .ToList() ?? new List<Waybill>();
                            var monthRevenue = monthWaybills.Sum(w => w.Fee)
                                - outgoingSplitsByMonth.GetValueOrDefault(month, 0)
                                + incomingSplitsByMonth.GetValueOrDefault(month, 0);
                            return new MonthlyStatsDto
                            {
                                Month = month,
                                WaybillCount = monthWaybills.Count,
                                Revenue = monthRevenue,
                                AverageFee = monthWaybills.Count > 0 ? monthRevenue / monthWaybills.Count : 0,
                            };
                        })
                        .ToList();
                }

                driverStats.Add(stats);
            }

            // 處理只有入帳分攤、沒有自己託運單的司機
            var existingDriverIds = driverStats.Select(d => d.DriverId).ToHashSet();
            foreach (var kvp in incomingSplitsByDriver)
            {
                if (existingDriverIds.Contains(kvp.Key)) continue;

                var splits = kvp.Value;
                var splitDriverName = splits.First().TargetDriver?.Name ?? "";

                var splitInvoicedRevenue = splits
                    .Where(fs => fs.Waybill.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(fs => fs.Amount);
                var splitNoInvoiceRevenue = splits
                    .Where(fs => fs.Waybill.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(fs => fs.Amount);
                var splitTotalRevenue = splitInvoicedRevenue + splitNoInvoiceRevenue;

                var splitStats = new DriverStatsDto
                {
                    DriverId = kvp.Key,
                    DriverName = splitDriverName,
                    TotalWaybills = 0,
                    InvoicedWaybills = 0,
                    NoInvoiceNeededWaybills = 0,
                    TotalRevenue = splitTotalRevenue,
                    InvoicedRevenue = splitInvoicedRevenue,
                    NoInvoiceNeededRevenue = splitNoInvoiceRevenue,
                    AverageWaybillFee = 0,
                    FirstWaybillDate = "",
                    LastWaybillDate = "",
                };

                if (includeMonthlyBreakdown)
                {
                    splitStats.MonthlyStats = splits
                        .Where(fs => !string.IsNullOrEmpty(fs.Waybill.Date) && fs.Waybill.Date.Length >= 7)
                        .GroupBy(fs => fs.Waybill.Date[..7])
                        .OrderBy(g => g.Key)
                        .Select(g => new MonthlyStatsDto
                        {
                            Month = g.Key,
                            WaybillCount = 0,
                            Revenue = g.Sum(fs => fs.Amount),
                            AverageFee = 0,
                        })
                        .ToList();
                }

                driverStats.Add(splitStats);
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
                AverageRevenuePerDriver =
                    activeDrivers > 0 ? allDriversTotalRevenue / activeDrivers : 0,
                TotalWaybills = totalWaybillCount,
                AverageWaybillsPerDriver =
                    activeDrivers > 0 ? (decimal)totalWaybillCount / activeDrivers : 0,
                TopDrivers = topDrivers,
                AllDrivers = driverStats,
            };

            return Ok(summary);
        }

        // GET: api/DriverStats/{driverId}
        [HttpGet("{driverId}")]
        [RequirePermission(Permission.StatisticsRead)]
        public async Task<ActionResult<DriverStatsDto>> GetDriverStatsById(
            string driverId,
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] bool includeMonthlyBreakdown = true
        )
        {
            // 驗證司機存在
            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver == null)
            {
                return NotFound(new { message = "找不到指定的司機" });
            }

            var query = _context.Waybills.Where(w => w.DriverId == driverId).AsQueryable();

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

            // 載入費用分攤資料
            var waybillIds = waybills.Select(w => w.Id).ToList();
            var outgoingSplits = await _context.WaybillFeeSplits
                .Where(fs => waybillIds.Contains(fs.WaybillId))
                .ToListAsync();

            var outgoingSplitsByWaybill = outgoingSplits
                .GroupBy(fs => fs.WaybillId)
                .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));

            // 載入入帳分攤
            var incomingSplitsQuery2 = _context.WaybillFeeSplits
                .Include(fs => fs.Waybill)
                .Where(fs => fs.TargetDriverId == driverId);

            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var inStart))
            {
                var inStartStr = inStart.ToString("yyyy-MM-dd");
                incomingSplitsQuery2 = incomingSplitsQuery2.Where(fs => fs.Waybill.Date.CompareTo(inStartStr) >= 0);
            }
            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var inEnd))
            {
                var inEndStr = inEnd.ToString("yyyy-MM-dd");
                incomingSplitsQuery2 = incomingSplitsQuery2.Where(fs => fs.Waybill.Date.CompareTo(inEndStr) <= 0);
            }

            var incomingSplits = await incomingSplitsQuery2.ToListAsync();

            // 計算調整後收入
            var invoicedRevenue = waybills
                .Where(w => w.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString())
                .Sum(w => w.Fee - outgoingSplitsByWaybill.GetValueOrDefault(w.Id, 0))
                + incomingSplits
                    .Where(fs => fs.Waybill.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(fs => fs.Amount);

            var noInvoiceRevenue = waybills
                .Where(w => w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                .Sum(w => w.Fee - outgoingSplitsByWaybill.GetValueOrDefault(w.Id, 0))
                + incomingSplits
                    .Where(fs => fs.Waybill.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                    .Sum(fs => fs.Amount);

            var totalRevenue = invoicedRevenue + noInvoiceRevenue;
            var waybillDates = waybills
                .Select(w => w.Date)
                .Where(d => !string.IsNullOrEmpty(d))
                .ToList();

            var stats = new DriverStatsDto
            {
                DriverId = driverId,
                DriverName = driver.Name ?? "",
                TotalWaybills = waybills.Count,
                InvoicedWaybills = waybills.Count(w => w.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString()),
                NoInvoiceNeededWaybills = waybills.Count(w =>
                    w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString()
                ),
                TotalRevenue = totalRevenue,
                InvoicedRevenue = invoicedRevenue,
                NoInvoiceNeededRevenue = noInvoiceRevenue,
                AverageWaybillFee = waybills.Count > 0 ? totalRevenue / waybills.Count : 0,
                FirstWaybillDate = waybillDates.Any() ? waybillDates.Min() : "",
                LastWaybillDate = waybillDates.Any() ? waybillDates.Max() : "",
            };

            // 月度統計
            if (includeMonthlyBreakdown)
            {
                var outgoingSplitsByMonth = outgoingSplits
                    .GroupBy(fs =>
                    {
                        var waybill = waybills.First(w => w.Id == fs.WaybillId);
                        return waybill.Date.Length >= 7 ? waybill.Date[..7] : "";
                    })
                    .Where(g => !string.IsNullOrEmpty(g.Key))
                    .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));

                var incomingSplitsByMonth = incomingSplits
                    .Where(fs => !string.IsNullOrEmpty(fs.Waybill.Date) && fs.Waybill.Date.Length >= 7)
                    .GroupBy(fs => fs.Waybill.Date[..7])
                    .ToDictionary(g => g.Key, g => g.Sum(fs => fs.Amount));

                var monthlyGroups = waybills
                    .Where(w => !string.IsNullOrEmpty(w.Date) && w.Date.Length >= 7)
                    .GroupBy(w => w.Date[..7]) // YYYY-MM
                    .OrderBy(g => g.Key)
                    .ToList();

                var allMonths = monthlyGroups.Select(g => g.Key)
                    .Union(incomingSplitsByMonth.Keys)
                    .OrderBy(m => m)
                    .Distinct()
                    .ToList();

                stats.MonthlyStats = allMonths
                    .Select(month =>
                    {
                        var monthWaybills = monthlyGroups
                            .FirstOrDefault(g => g.Key == month)?
                            .ToList() ?? new List<Waybill>();
                        var monthRevenue = monthWaybills.Sum(w => w.Fee)
                            - outgoingSplitsByMonth.GetValueOrDefault(month, 0)
                            + incomingSplitsByMonth.GetValueOrDefault(month, 0);
                        return new MonthlyStatsDto
                        {
                            Month = month,
                            WaybillCount = monthWaybills.Count,
                            Revenue = monthRevenue,
                            AverageFee = monthWaybills.Count > 0 ? monthRevenue / monthWaybills.Count : 0,
                        };
                    })
                    .ToList();
            }

            return Ok(stats);
        }

        // GET: api/DriverStats/summary
        [HttpGet("summary")]
        [RequirePermission(Permission.StatisticsRead)]
        public async Task<ActionResult<object>> GetDriverStatsSummary(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate
        )
        {
            var query = _context
                .Waybills.Include(w => w.Driver)
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

            // 活躍司機數：包含有託運單的司機 + 只有入帳分攤的司機
            var waybillDriverIds = waybills.Select(w => w.DriverId).Distinct().ToList();
            var splitTargetQuery = _context.WaybillFeeSplits
                .Include(fs => fs.Waybill)
                .AsQueryable();
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var splitStart))
            {
                var splitStartStr = splitStart.ToString("yyyy-MM-dd");
                splitTargetQuery = splitTargetQuery.Where(fs => fs.Waybill.Date.CompareTo(splitStartStr) >= 0);
            }
            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var splitEnd))
            {
                var splitEndStr = splitEnd.ToString("yyyy-MM-dd");
                splitTargetQuery = splitTargetQuery.Where(fs => fs.Waybill.Date.CompareTo(splitEndStr) <= 0);
            }
            var splitTargetDriverIds = await splitTargetQuery
                .Select(fs => fs.TargetDriverId)
                .Distinct()
                .ToListAsync();
            var activeDriversCount = waybillDriverIds
                .Union(splitTargetDriverIds)
                .Distinct()
                .Count();

            // 狀態統計
            var pendingCount = waybills.Count(w => w.Status == WaybillStatus.PENDING.ToString());
            var invoicedCount = waybills.Count(w => w.Status == WaybillStatus.INVOICED.ToString());
            var noInvoiceCount = waybills.Count(w => w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString());

            var pendingRevenue = waybills
                .Where(w => w.Status == WaybillStatus.PENDING.ToString())
                .Sum(w => w.Fee);
            var invoicedRevenue = waybills
                .Where(w => w.Status == WaybillStatus.INVOICED.ToString())
                .Sum(w => w.Fee);
            var noInvoiceRevenue = waybills
                .Where(w => w.Status == WaybillStatus.NO_INVOICE_NEEDED.ToString())
                .Sum(w => w.Fee);

            var summary = new
            {
                TotalWaybills = totalWaybills,
                TotalRevenue = totalRevenue,
                ActiveDrivers = activeDriversCount,
                AverageRevenuePerDriver = activeDriversCount > 0
                    ? totalRevenue / activeDriversCount
                    : 0,
                AverageWaybillFee = totalWaybills > 0 ? totalRevenue / totalWaybills : 0,
                StatusBreakdown = new
                {
                    Pending = new { Count = pendingCount, Revenue = pendingRevenue },
                    Invoiced = new { Count = invoicedCount, Revenue = invoicedRevenue },
                    NoInvoiceNeeded = new { Count = noInvoiceCount, Revenue = noInvoiceRevenue },
                },
            };

            return Ok(summary);
        }
    }
}