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
    public class WaybillController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WaybillController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Waybill?startDate=2024-01-01&endDate=2024-01-31&driverId=xxx&locationSearch=xxx&companySearch=xxx
        [HttpGet]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<IEnumerable<WaybillDto>>> GetWaybills(
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null,
            [FromQuery] string? driverId = null,
            [FromQuery] string? locationSearch = null,
            [FromQuery] string? companySearch = null
        )
        {
            var query = _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .AsQueryable();

            // 日期範圍篩選將在客戶端進行

            // 司機篩選
            if (!string.IsNullOrEmpty(driverId))
            {
                query = query.Where(w => w.DriverId == driverId);
            }

            // 地點搜尋篩選
            if (!string.IsNullOrEmpty(locationSearch))
            {
                var searchTerm = locationSearch.Trim();
                query = query.Where(w =>
                    w.LoadingLocations.Any(l =>
                        l.FromLocation.Contains(searchTerm) || l.ToLocation.Contains(searchTerm)
                    )
                );
            }

            // 貨主搜尋篩選
            if (!string.IsNullOrEmpty(companySearch))
            {
                var companySearchTerm = companySearch.Trim();
                query = query.Where(w => w.Company.Name.Contains(companySearchTerm));
            }

            var waybills = await query
                .OrderByDescending(w => w.Date)
                .ThenByDescending(w => w.CreatedAt)
                .ToListAsync();

            // Client-side date filtering if needed
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                waybills = waybills.Where(w => DateTime.Parse(w.Date) >= start).ToList();
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                waybills = waybills.Where(w => DateTime.Parse(w.Date) <= end).ToList();
            }

            var result = waybills
                .Select(w => new WaybillDto
                {
                    Id = w.Id,
                    // WaybillNumber = w.WaybillNumber,
                    Date = w.Date,
                    Item = w.Item,
                    Tonnage = w.Tonnage,
                    CompanyId = w.CompanyId,
                    CompanyName = w.Company.Name,
                    WorkingTimeStart = w.WorkingTimeStart,
                    WorkingTimeEnd = w.WorkingTimeEnd,
                    Fee = w.Fee,
                    DriverId = w.DriverId,
                    DriverName = w.Driver.Name,
                    PlateNumber = w.PlateNumber,
                    Notes = w.Notes,
                    Status = w.Status,
                    InvoiceId = w.InvoiceId,
                    TaxAmount = w.TaxAmount,
                    TaxRate = w.TaxRate,
                    PaymentNotes = w.PaymentNotes,
                    PaymentReceivedAt = w.PaymentReceivedAt,
                    PaymentMethod = w.PaymentMethod,
                    LoadingLocations = w
                        .LoadingLocations.OrderBy(l => l.SequenceOrder)
                        .Select(l => new LoadingLocationDto
                        {
                            From = l.FromLocation,
                            To = l.ToLocation,
                        })
                        .ToList(),
                    ExtraExpenses = w
                        .ExtraExpenses.Select(e => new ExtraExpenseDto
                        {
                            Id = e.Id,
                            Item = e.Item ?? e.Description,
                            Fee = e.Fee ?? e.Amount,
                            Notes = e.Notes,
                        })
                        .ToList(),
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                })
                .ToList();

            return Ok(result);
        }

        // GET: api/Waybill/5
        [HttpGet("{id}")]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<WaybillDto>> GetWaybill(string id)
        {
            var waybill = await _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (waybill == null)
            {
                return NotFound();
            }

            var result = new WaybillDto
            {
                Id = waybill.Id,
                // WaybillNumber = waybill.WaybillNumber,
                Date = waybill.Date,
                Item = waybill.Item,
                Tonnage = waybill.Tonnage,
                CompanyId = waybill.CompanyId,
                CompanyName = waybill.Company.Name,
                WorkingTimeStart = waybill.WorkingTimeStart,
                WorkingTimeEnd = waybill.WorkingTimeEnd,
                Fee = waybill.Fee,
                DriverId = waybill.DriverId,
                DriverName = waybill.Driver.Name,
                PlateNumber = waybill.PlateNumber,
                Notes = waybill.Notes,
                Status = waybill.Status,
                InvoiceId = waybill.InvoiceId,
                TaxAmount = waybill.TaxAmount,
                TaxRate = waybill.TaxRate,
                PaymentNotes = waybill.PaymentNotes,
                PaymentReceivedAt = waybill.PaymentReceivedAt,
                PaymentMethod = waybill.PaymentMethod,
                LoadingLocations = waybill
                    .LoadingLocations.OrderBy(l => l.SequenceOrder)
                    .Select(l => new LoadingLocationDto
                    {
                        From = l.FromLocation,
                        To = l.ToLocation,
                    })
                    .ToList(),
                ExtraExpenses = waybill
                    .ExtraExpenses.Select(e => new ExtraExpenseDto
                    {
                        Item = e.Item ?? e.Description,
                        Fee = e.Fee ?? e.Amount,
                        Notes = e.Notes,
                    })
                    .ToList(),
                CreatedAt = waybill.CreatedAt,
                UpdatedAt = waybill.UpdatedAt,
            };

            return Ok(result);
        }

        // POST: api/Waybill
        [HttpPost]
        [RequirePermission(Permission.WaybillCreate)]
        public async Task<ActionResult<WaybillDto>> CreateWaybill(CreateWaybillDto createWaybillDto)
        {
            // 驗證公司和司機存在
            var company = await _context.Companies.FindAsync(createWaybillDto.CompanyId);
            var driver = await _context.Drivers.FindAsync(createWaybillDto.DriverId);

            if (company == null || !company.IsActive)
            {
                return BadRequest(new { message = "無效的公司ID或公司已停用" });
            }

            if (driver == null || !driver.IsActive)
            {
                return BadRequest(new { message = "無效的司機ID或司機已停用" });
            }

            // 檢查託運單號碼是否重複 (僅提醒，不阻止)
            // var existingWaybill = await _context.Waybills
            //     .FirstOrDefaultAsync(w => w.WaybillNumber == createWaybillDto.WaybillNumber);

            var warnings = new List<string>();
            // if (existingWaybill != null)
            // {
            //     warnings.Add($"託運單號碼 '{createWaybillDto.WaybillNumber}' 已存在，請確認是否重複。");
            // }

            var waybill = new Waybill
            {
                // WaybillNumber = createWaybillDto.WaybillNumber,
                Date = createWaybillDto.Date,
                Item = createWaybillDto.Item,
                Tonnage = createWaybillDto.Tonnage,
                CompanyId = createWaybillDto.CompanyId,
                WorkingTimeStart = createWaybillDto.WorkingTimeStart,
                WorkingTimeEnd = createWaybillDto.WorkingTimeEnd,
                Fee = createWaybillDto.Fee,
                DriverId = createWaybillDto.DriverId,
                PlateNumber = createWaybillDto.PlateNumber,
                Notes = createWaybillDto.Notes,
                Status = createWaybillDto.MarkAsNoInvoiceNeeded
                    ? WaybillStatus.NO_INVOICE_NEEDED.ToString()
                    : WaybillStatus.PENDING.ToString(),
            };

            _context.Waybills.Add(waybill);
            await _context.SaveChangesAsync();

            // 新增裝卸地點
            var sequenceOrder = 1;
            foreach (var location in createWaybillDto.LoadingLocations)
            {
                var loadingLocation = new LoadingLocation
                {
                    WaybillId = waybill.Id,
                    FromLocation = location.From,
                    ToLocation = location.To,
                    SequenceOrder = sequenceOrder++,
                };
                _context.LoadingLocations.Add(loadingLocation);
            }

            // 新增額外費用
            foreach (var expense in createWaybillDto.ExtraExpenses)
            {
                var extraExpense = new ExtraExpense
                {
                    WaybillId = waybill.Id,
                    Description = expense.Item,
                    Amount = expense.Fee,
                    Item = expense.Item,
                    Fee = expense.Fee,
                    Notes = expense.Notes,
                };
                _context.ExtraExpenses.Add(extraExpense);
            }

            await _context.SaveChangesAsync();

            // 重新載入完整資料
            var createdWaybill = await _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .FirstOrDefaultAsync(w => w.Id == waybill.Id);

            var result = new WaybillDto
            {
                Id = createdWaybill!.Id,
                // WaybillNumber = createdWaybill.WaybillNumber,
                Date = createdWaybill.Date,
                Item = createdWaybill.Item,
                Tonnage = createdWaybill.Tonnage,
                CompanyId = createdWaybill.CompanyId,
                CompanyName = createdWaybill.Company.Name,
                WorkingTimeStart = createdWaybill.WorkingTimeStart,
                WorkingTimeEnd = createdWaybill.WorkingTimeEnd,
                Fee = createdWaybill.Fee,
                DriverId = createdWaybill.DriverId,
                DriverName = createdWaybill.Driver.Name,
                PlateNumber = createdWaybill.PlateNumber,
                Notes = createdWaybill.Notes,
                Status = createdWaybill.Status,
                InvoiceId = createdWaybill.InvoiceId,
                LoadingLocations = createdWaybill
                    .LoadingLocations.OrderBy(l => l.SequenceOrder)
                    .Select(l => new LoadingLocationDto
                    {
                        From = l.FromLocation,
                        To = l.ToLocation,
                    })
                    .ToList(),
                ExtraExpenses = createdWaybill
                    .ExtraExpenses.Select(e => new ExtraExpenseDto
                    {
                        Item = e.Item ?? e.Description,
                        Fee = e.Fee ?? e.Amount,
                        Notes = e.Notes,
                    })
                    .ToList(),
                CreatedAt = createdWaybill.CreatedAt,
                UpdatedAt = createdWaybill.UpdatedAt,
            };

            var response = new { data = result, warnings = warnings };

            return CreatedAtAction(nameof(GetWaybill), new { id = waybill.Id }, response);
        }

        // PUT: api/Waybill/5
        [HttpPut("{id}")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult<WaybillDto>> UpdateWaybill(
            string id,
            UpdateWaybillDto updateWaybillDto
        )
        {
            var waybill = await _context
                .Waybills.Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 PENDING 狀態可以編輯
            if (waybill.Status != WaybillStatus.PENDING.ToString())
            {
                return BadRequest(
                    new
                    {
                        message = $"無法編輯狀態為 '{waybill.Status}' 的託運單，只有 'PENDING' 狀態的託運單可以編輯",
                    }
                );
            }

            // 驗證公司和司機存在
            var company = await _context.Companies.FindAsync(updateWaybillDto.CompanyId);
            var driver = await _context.Drivers.FindAsync(updateWaybillDto.DriverId);

            if (company == null || !company.IsActive)
            {
                return BadRequest(new { message = "無效的公司ID或公司已停用" });
            }

            if (driver == null || !driver.IsActive)
            {
                return BadRequest(new { message = "無效的司機ID或司機已停用" });
            }

            // 檢查託運單號碼是否重複 (僅提醒，不阻止)
            // var existingWaybill = await _context.Waybills
            //     .FirstOrDefaultAsync(w => w.WaybillNumber == updateWaybillDto.WaybillNumber && w.Id != id);

            var warnings = new List<string>();
            // if (existingWaybill != null)
            // {
            //     warnings.Add($"託運單號碼 '{updateWaybillDto.WaybillNumber}' 已存在，請確認是否重複。");
            // }

            // 更新主要資料
            // waybill.WaybillNumber = updateWaybillDto.WaybillNumber;
            waybill.Date = updateWaybillDto.Date;
            waybill.Item = updateWaybillDto.Item;
            waybill.Tonnage = updateWaybillDto.Tonnage;
            waybill.CompanyId = updateWaybillDto.CompanyId;
            waybill.WorkingTimeStart = updateWaybillDto.WorkingTimeStart;
            waybill.WorkingTimeEnd = updateWaybillDto.WorkingTimeEnd;
            waybill.Fee = updateWaybillDto.Fee;
            waybill.DriverId = updateWaybillDto.DriverId;
            waybill.PlateNumber = updateWaybillDto.PlateNumber;
            waybill.Notes = updateWaybillDto.Notes;
            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            // 刪除舊的裝卸地點和額外費用
            _context.LoadingLocations.RemoveRange(waybill.LoadingLocations);
            _context.ExtraExpenses.RemoveRange(waybill.ExtraExpenses);

            // 新增新的裝卸地點
            var sequenceOrder = 1;
            foreach (var location in updateWaybillDto.LoadingLocations)
            {
                var loadingLocation = new LoadingLocation
                {
                    WaybillId = waybill.Id,
                    FromLocation = location.From,
                    ToLocation = location.To,
                    SequenceOrder = sequenceOrder++,
                };
                _context.LoadingLocations.Add(loadingLocation);
            }

            // 新增新的額外費用
            foreach (var expense in updateWaybillDto.ExtraExpenses)
            {
                var extraExpense = new ExtraExpense
                {
                    WaybillId = waybill.Id,
                    Description = expense.Item,
                    Amount = expense.Fee,
                    Item = expense.Item,
                    Fee = expense.Fee,
                    Notes = expense.Notes,
                };
                _context.ExtraExpenses.Add(extraExpense);
            }

            await _context.SaveChangesAsync();

            // 重新載入完整資料
            var updatedWaybill = await _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .FirstOrDefaultAsync(w => w.Id == id);

            var result = new WaybillDto
            {
                Id = updatedWaybill!.Id,
                // WaybillNumber = updatedWaybill.WaybillNumber,
                Date = updatedWaybill.Date,
                Item = updatedWaybill.Item,
                Tonnage = updatedWaybill.Tonnage,
                CompanyId = updatedWaybill.CompanyId,
                CompanyName = updatedWaybill.Company.Name,
                WorkingTimeStart = updatedWaybill.WorkingTimeStart,
                WorkingTimeEnd = updatedWaybill.WorkingTimeEnd,
                Fee = updatedWaybill.Fee,
                DriverId = updatedWaybill.DriverId,
                DriverName = updatedWaybill.Driver.Name,
                PlateNumber = updatedWaybill.PlateNumber,
                Notes = updatedWaybill.Notes,
                Status = updatedWaybill.Status,
                InvoiceId = updatedWaybill.InvoiceId,
                LoadingLocations = updatedWaybill
                    .LoadingLocations.OrderBy(l => l.SequenceOrder)
                    .Select(l => new LoadingLocationDto
                    {
                        From = l.FromLocation,
                        To = l.ToLocation,
                    })
                    .ToList(),
                ExtraExpenses = updatedWaybill
                    .ExtraExpenses.Select(e => new ExtraExpenseDto
                    {
                        Item = e.Item ?? e.Description,
                        Fee = e.Fee ?? e.Amount,
                        Notes = e.Notes,
                    })
                    .ToList(),
                CreatedAt = updatedWaybill.CreatedAt,
                UpdatedAt = updatedWaybill.UpdatedAt,
            };

            var response = new { data = result, warnings = warnings };

            return Ok(response);
        }

        // DELETE: api/Waybill/5
        [HttpDelete("{id}")]
        [RequirePermission(Permission.WaybillDelete)]
        public async Task<IActionResult> DeleteWaybill(string id)
        {
            var waybill = await _context
                .Waybills.Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 PENDING 狀態可以刪除
            if (waybill.Status != WaybillStatus.PENDING.ToString())
            {
                return BadRequest(
                    new
                    {
                        message = $"無法刪除狀態為 '{waybill.Status}' 的託運單，只有 'PENDING' 狀態的託運單可以刪除",
                    }
                );
            }

            // 刪除關聯的裝卸地點和額外費用 (CASCADE)
            _context.LoadingLocations.RemoveRange(waybill.LoadingLocations);
            _context.ExtraExpenses.RemoveRange(waybill.ExtraExpenses);

            // 刪除託運單
            _context.Waybills.Remove(waybill);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Waybill/5/no-invoice
        [HttpPut("{id}/no-invoice")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> MarkAsNoInvoiceNeeded(string id)
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 PENDING 狀態可以標記為不需開發票
            if (waybill.Status != WaybillStatus.PENDING.ToString())
            {
                return BadRequest(
                    new
                    {
                        message = $"無法將狀態為 '{waybill.Status}' 的託運單標記為不需開發票，只有 'PENDING' 狀態的託運單可以標記",
                    }
                );
            }

            waybill.Status = WaybillStatus.NO_INVOICE_NEEDED.ToString();
            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "託運單已成功標記為不需開發票" });
        }

        // PUT: api/Waybill/no-invoice-batch
        [HttpPut("no-invoice-batch")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> MarkAsNoInvoiceNeededBatch(
            [FromBody] List<string> waybillIds
        )
        {
            if (waybillIds == null || !waybillIds.Any())
            {
                return BadRequest(new { message = "請提供要標記的託運單ID列表" });
            }

            var results = new List<object>();
            var successCount = 0;
            var failureCount = 0;

            // 批量查詢所有託運單
            var waybills = await _context
                .Waybills.Where(w => waybillIds.Contains(w.Id))
                .ToListAsync();

            var foundWaybillIds = waybills.Select(w => w.Id).ToHashSet();
            var notFoundIds = waybillIds.Where(id => !foundWaybillIds.Contains(id)).ToList();

            // 處理找不到的託運單
            foreach (var notFoundId in notFoundIds)
            {
                results.Add(
                    new
                    {
                        id = notFoundId,
                        success = false,
                        message = "找不到指定的託運單",
                    }
                );
                failureCount++;
            }

            // 處理找到的託運單
            foreach (var waybill in waybills)
            {
                try
                {
                    // 檢查狀態：只有 PENDING 狀態可以標記為不需開發票
                    if (waybill.Status != WaybillStatus.PENDING.ToString())
                    {
                        results.Add(
                            new
                            {
                                id = waybill.Id,
                                // waybillNumber = waybill.WaybillNumber,
                                success = false,
                                message = $"無法將狀態為 '{waybill.Status}' 的託運單標記為不需開發票，只有 'PENDING' 狀態的託運單可以標記",
                            }
                        );
                        failureCount++;
                        continue;
                    }

                    // 更新狀態
                    waybill.Status = WaybillStatus.NO_INVOICE_NEEDED.ToString();
                    waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                    results.Add(
                        new
                        {
                            id = waybill.Id,
                            // waybillNumber = waybill.WaybillNumber,
                            success = true,
                            message = "託運單已成功標記為不需開發票",
                        }
                    );
                    successCount++;
                }
                catch (Exception ex)
                {
                    results.Add(
                        new
                        {
                            id = waybill.Id,
                            // waybillNumber = waybill.WaybillNumber,
                            success = false,
                            message = $"標記託運單時發生錯誤：{ex.Message}",
                        }
                    );
                    failureCount++;
                }
            }

            // 批量保存變更
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "批量標記過程中發生資料庫錯誤", error = ex.Message }
                );
            }

            return Ok(
                new
                {
                    message = $"批量標記完成：成功 {successCount} 筆，失敗 {failureCount} 筆",
                    summary = new
                    {
                        total = waybillIds.Count,
                        success = successCount,
                        failure = failureCount,
                    },
                    details = results,
                }
            );
        }

        // PUT: api/Waybill/5/restore
        [HttpPut("{id}/restore")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> RestoreWaybill(string id)
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 NO_INVOICE_NEEDED、NEED_TAX_UNPAID 或 NEED_TAX_PAID 狀態可以還原
            if (
                waybill.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString()
                && waybill.Status != WaybillStatus.NEED_TAX_UNPAID.ToString()
                && waybill.Status != WaybillStatus.NEED_TAX_PAID.ToString()
            )
            {
                return BadRequest(
                    new
                    {
                        message = $"無法還原狀態為 '{waybill.Status}' 的託運單，只有 'NO_INVOICE_NEEDED'、'NEED_TAX_UNPAID' 或 'NEED_TAX_PAID' 狀態的託運單可以還原",
                    }
                );
            }

            waybill.Status = WaybillStatus.PENDING.ToString();

            // 清除税额和收款相关字段
            waybill.TaxAmount = null;
            waybill.PaymentNotes = null;
            waybill.PaymentReceivedAt = null;
            waybill.PaymentMethod = null;

            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "託運單已成功還原為待處理狀態" });
        }

        // PUT: api/Waybill/restore-batch
        [HttpPut("restore-batch")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> RestoreWaybillsBatch([FromBody] List<string> waybillIds)
        {
            if (waybillIds == null || !waybillIds.Any())
            {
                return BadRequest(new { message = "請提供要還原的託運單ID列表" });
            }

            var results = new List<object>();
            var successCount = 0;
            var failureCount = 0;

            // 批量查詢所有託運單
            var waybills = await _context
                .Waybills.Where(w => waybillIds.Contains(w.Id))
                .ToListAsync();

            var foundWaybillIds = waybills.Select(w => w.Id).ToHashSet();
            var notFoundIds = waybillIds.Where(id => !foundWaybillIds.Contains(id)).ToList();

            // 處理找不到的託運單
            foreach (var notFoundId in notFoundIds)
            {
                results.Add(
                    new
                    {
                        id = notFoundId,
                        success = false,
                        message = "找不到指定的託運單",
                    }
                );
                failureCount++;
            }

            // 處理找到的託運單
            foreach (var waybill in waybills)
            {
                try
                {
                    // 檢查狀態：只有 NO_INVOICE_NEEDED、NEED_TAX_UNPAID 或 NEED_TAX_PAID 狀態可以還原
                    if (
                        waybill.Status != WaybillStatus.NO_INVOICE_NEEDED.ToString()
                        && waybill.Status != WaybillStatus.NEED_TAX_UNPAID.ToString()
                        && waybill.Status != WaybillStatus.NEED_TAX_PAID.ToString()
                    )
                    {
                        results.Add(
                            new
                            {
                                id = waybill.Id,
                                // waybillNumber = waybill.WaybillNumber,
                                success = false,
                                message = $"無法還原狀態為 '{waybill.Status}' 的託運單，只有 'NO_INVOICE_NEEDED'、'NEED_TAX_UNPAID' 或 'NEED_TAX_PAID' 狀態的託運單可以還原",
                            }
                        );
                        failureCount++;
                        continue;
                    }

                    // 更新狀態
                    waybill.Status = WaybillStatus.PENDING.ToString();

                    // 清除税额和收款相关字段
                    waybill.TaxAmount = null;
                    waybill.PaymentNotes = null;
                    waybill.PaymentReceivedAt = null;
                    waybill.PaymentMethod = null;

                    waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                    results.Add(
                        new
                        {
                            id = waybill.Id,
                            // waybillNumber = waybill.WaybillNumber,
                            success = true,
                            message = "託運單已成功還原為待處理狀態",
                        }
                    );
                    successCount++;
                }
                catch (Exception ex)
                {
                    results.Add(
                        new
                        {
                            id = waybill.Id,
                            // waybillNumber = waybill.WaybillNumber,
                            success = false,
                            message = $"還原託運單時發生錯誤：{ex.Message}",
                        }
                    );
                    failureCount++;
                }
            }

            // 批量保存變更
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "批量還原過程中發生資料庫錯誤", error = ex.Message }
                );
            }

            return Ok(
                new
                {
                    message = $"批量還原完成：成功 {successCount} 筆，失敗 {failureCount} 筆",
                    summary = new
                    {
                        total = waybillIds.Count,
                        success = successCount,
                        failure = failureCount,
                    },
                    details = results,
                }
            );
        }

        // POST: api/Waybill/by-ids
        [HttpPost("by-ids")]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<IEnumerable<WaybillDto>>> GetWaybillsByIds(
            [FromBody] List<string> waybillIds
        )
        {
            if (waybillIds == null || !waybillIds.Any())
            {
                return BadRequest(new { message = "請提供託運單ID列表" });
            }

            var waybills = await _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .Where(w => waybillIds.Contains(w.Id))
                .OrderByDescending(w => w.Date)
                .ThenByDescending(w => w.CreatedAt)
                .ToListAsync();

            var result = waybills
                .Select(w => new WaybillDto
                {
                    Id = w.Id,
                    // WaybillNumber = w.WaybillNumber,
                    Date = w.Date,
                    Item = w.Item,
                    Tonnage = w.Tonnage,
                    CompanyId = w.CompanyId,
                    CompanyName = w.Company.Name,
                    WorkingTimeStart = w.WorkingTimeStart,
                    WorkingTimeEnd = w.WorkingTimeEnd,
                    Fee = w.Fee,
                    DriverId = w.DriverId,
                    DriverName = w.Driver.Name,
                    PlateNumber = w.PlateNumber,
                    Notes = w.Notes,
                    Status = w.Status,
                    InvoiceId = w.InvoiceId,
                    TaxAmount = w.TaxAmount,
                    TaxRate = w.TaxRate,
                    PaymentNotes = w.PaymentNotes,
                    PaymentReceivedAt = w.PaymentReceivedAt,
                    PaymentMethod = w.PaymentMethod,
                    LoadingLocations = w
                        .LoadingLocations.OrderBy(l => l.SequenceOrder)
                        .Select(l => new LoadingLocationDto
                        {
                            From = l.FromLocation,
                            To = l.ToLocation,
                        })
                        .ToList(),
                    ExtraExpenses = w
                        .ExtraExpenses.Select(e => new ExtraExpenseDto
                        {
                            Id = e.Id,
                            Item = e.Item ?? e.Description,
                            Fee = e.Fee ?? e.Amount,
                            Notes = e.Notes,
                        })
                        .ToList(),
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                })
                .ToList();

            return Ok(result);
        }

        // GET: api/Waybill/suggested-for-invoice?companyId={id}
        [HttpGet("suggested-for-invoice")]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<IEnumerable<WaybillDto>>> GetSuggestedWaybillsForInvoice(
            [FromQuery] string companyId
        )
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "請提供公司ID" });
            }

            // 計算一年前的日期
            var oneYearAgo = DateTime.UtcNow.AddYears(-1).ToString("yyyy-MM-dd");

            var waybills = await _context
                .Waybills.Include(w => w.Company)
                .Include(w => w.Driver)
                .Include(w => w.LoadingLocations)
                .Include(w => w.ExtraExpenses)
                .Where(w =>
                    w.CompanyId == companyId
                    && w.Status == WaybillStatus.PENDING.ToString()
                    && w.Date.CompareTo(oneYearAgo) >= 0
                )
                .OrderByDescending(w => w.Date)
                .ThenByDescending(w => w.CreatedAt)
                .ToListAsync();

            var result = waybills
                .Select(w => new WaybillDto
                {
                    Id = w.Id,
                    // WaybillNumber = w.WaybillNumber,
                    Date = w.Date,
                    Item = w.Item,
                    Tonnage = w.Tonnage,
                    CompanyId = w.CompanyId,
                    CompanyName = w.Company.Name,
                    WorkingTimeStart = w.WorkingTimeStart,
                    WorkingTimeEnd = w.WorkingTimeEnd,
                    Fee = w.Fee,
                    DriverId = w.DriverId,
                    DriverName = w.Driver.Name,
                    PlateNumber = w.PlateNumber,
                    Notes = w.Notes,
                    Status = w.Status,
                    InvoiceId = w.InvoiceId,
                    LoadingLocations = w
                        .LoadingLocations.OrderBy(l => l.SequenceOrder)
                        .Select(l => new LoadingLocationDto
                        {
                            From = l.FromLocation,
                            To = l.ToLocation,
                        })
                        .ToList(),
                    ExtraExpenses = w
                        .ExtraExpenses.Select(e => new ExtraExpenseDto
                        {
                            Id = e.Id,
                            Item = e.Item ?? e.Description,
                            Fee = e.Fee ?? e.Amount,
                            Notes = e.Notes,
                        })
                        .ToList(),
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                })
                .ToList();

            return Ok(result);
        }

        // PUT: api/Waybill/5/mark-unpaid-with-tax
        [HttpPut("{id}/mark-unpaid-with-tax")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> MarkAsUnpaidWithTax(
            string id,
            [FromBody] MarkUnpaidWithTaxDto? dto
        )
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 PENDING 狀態可以標記為未收款
            if (waybill.Status != WaybillStatus.PENDING.ToString())
            {
                return BadRequest(
                    new
                    {
                        message = $"無法將狀態為 '{waybill.Status}' 的託運單標記為未收款，只有 'PENDING' 狀態的託運單可以標記",
                    }
                );
            }

            // 計算稅額（固定 5%）
            waybill.TaxAmount = waybill.Fee * 0.05m;
            waybill.TaxRate = 0.05m;
            waybill.Status = WaybillStatus.NEED_TAX_UNPAID.ToString();

            // 更新備註（如果有提供）
            if (dto?.Notes != null)
            {
                waybill.Notes = dto.Notes;
            }

            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "託運單已成功標記為未收款狀態" });
        }

        // PUT: api/Waybill/5/mark-paid-with-tax
        [HttpPut("{id}/mark-paid-with-tax")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> MarkAsPaidWithTax(
            string id,
            [FromBody] MarkPaidWithTaxDto dto
        )
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：PENDING 或 NEED_TAX_UNPAID 可以標記為已收款
            if (
                waybill.Status != WaybillStatus.PENDING.ToString()
                && waybill.Status != WaybillStatus.NEED_TAX_UNPAID.ToString()
            )
            {
                return BadRequest(
                    new
                    {
                        message = $"無法將狀態為 '{waybill.Status}' 的託運單標記為已收款，只有 'PENDING' 或 'NEED_TAX_UNPAID' 狀態的託運單可以標記",
                    }
                );
            }

            // 如果從 PENDING 來，需要計算稅額
            if (waybill.Status == WaybillStatus.PENDING.ToString())
            {
                waybill.TaxAmount = waybill.Fee * 0.05m;
                waybill.TaxRate = 0.05m;
            }

            waybill.Status = WaybillStatus.NEED_TAX_PAID.ToString();
            waybill.PaymentNotes = dto.PaymentNotes;
            waybill.PaymentReceivedAt = dto.PaymentDate;
            waybill.PaymentMethod = dto.PaymentMethod;
            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "託運單已成功標記為已收款狀態" });
        }

        // PUT: api/Waybill/5/toggle-payment-status
        [HttpPut("{id}/toggle-payment-status")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> TogglePaymentStatus(
            string id,
            [FromBody] MarkPaidWithTaxDto? dto
        )
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 切換收款狀態：未收款 ↔ 已收款
            if (waybill.Status == WaybillStatus.NEED_TAX_UNPAID.ToString())
            {
                // 從未收款切換到已收款
                if (dto == null)
                {
                    return BadRequest(new { message = "標記為已收款需要提供收款資訊" });
                }

                waybill.Status = WaybillStatus.NEED_TAX_PAID.ToString();
                waybill.PaymentNotes = dto.PaymentNotes;
                waybill.PaymentReceivedAt = dto.PaymentDate;
                waybill.PaymentMethod = dto.PaymentMethod;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                return Ok(new { message = "託運單已成功標記為已收款" });
            }
            else if (waybill.Status == WaybillStatus.NEED_TAX_PAID.ToString())
            {
                // 從已收款切換到未收款
                waybill.Status = WaybillStatus.NEED_TAX_UNPAID.ToString();
                waybill.PaymentNotes = null;
                waybill.PaymentReceivedAt = null;
                waybill.PaymentMethod = null;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                return Ok(new { message = "託運單已成功標記為未收款" });
            }
            else
            {
                return BadRequest(
                    new
                    {
                        message = $"無法切換狀態為 '{waybill.Status}' 的託運單收款狀態，只有 'NEED_TAX_UNPAID' 或 'NEED_TAX_PAID' 狀態可以切換",
                    }
                );
            }
        }

        // PUT: api/Waybill/5/update-payment-notes
        [HttpPut("{id}/update-payment-notes")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<IActionResult> UpdatePaymentNotes(
            string id,
            [FromBody] UpdatePaymentNotesDto dto
        )
        {
            var waybill = await _context.Waybills.FindAsync(id);

            if (waybill == null)
            {
                return NotFound();
            }

            // 檢查狀態：只有 NEED_TAX_UNPAID 或 NEED_TAX_PAID 狀態可以編輯收款備註
            if (
                waybill.Status != WaybillStatus.NEED_TAX_UNPAID.ToString()
                && waybill.Status != WaybillStatus.NEED_TAX_PAID.ToString()
            )
            {
                return BadRequest(
                    new
                    {
                        message = $"無法編輯狀態為 '{waybill.Status}' 的託運單收款備註，只有 'NEED_TAX_UNPAID' 或 'NEED_TAX_PAID' 狀態的託運單可以編輯",
                    }
                );
            }

            waybill.PaymentNotes = dto.PaymentNotes;
            waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "收款備註已成功更新" });
        }

        // PUT: api/Waybill/batch-mark-unpaid-with-tax
        // [HttpPut("batch-mark-unpaid-with-tax")]
        // [RequirePermission(Permission.WaybillUpdate)]
        // public async Task<IActionResult> BatchMarkAsUnpaidWithTax(
        //     [FromBody] List<string> waybillIds
        // )
        // {
        //     if (waybillIds == null || !waybillIds.Any())
        //     {
        //         return BadRequest(new { message = "請提供要標記的託運單ID列表" });
        //     }
        //
        //     var results = new List<object>();
        //     var successCount = 0;
        //     var failureCount = 0;
        //
        //     // 批量查詢所有託運單
        //     var waybills = await _context
        //         .Waybills.Where(w => waybillIds.Contains(w.Id))
        //         .ToListAsync();
        //
        //     var foundWaybillIds = waybills.Select(w => w.Id).ToHashSet();
        //     var notFoundIds = waybillIds.Where(id => !foundWaybillIds.Contains(id)).ToList();
        //
        //     // 處理找不到的託運單
        //     foreach (var notFoundId in notFoundIds)
        //     {
        //         results.Add(
        //             new
        //             {
        //                 id = notFoundId,
        //                 success = false,
        //                 message = "找不到指定的託運單",
        //             }
        //         );
        //         failureCount++;
        //     }
        //
        //     // 處理找到的託運單
        //     foreach (var waybill in waybills)
        //     {
        //         try
        //         {
        //             // 檢查狀態：只有 PENDING 狀態可以標記
        //             if (waybill.Status != WaybillStatus.PENDING.ToString())
        //             {
        //                 results.Add(
        //                     new
        //                     {
        //                         id = waybill.Id,
        //                         success = false,
        //                         message = $"無法標記狀態為 '{waybill.Status}' 的託運單，只有 'PENDING' 狀態的託運單可以標記",
        //                     }
        //                 );
        //                 failureCount++;
        //                 continue;
        //             }
        //
        //             // 計算稅額並更新狀態
        //             waybill.TaxAmount = waybill.Fee * 0.05m;
        //             waybill.TaxRate = 0.05m;
        //             waybill.Status = WaybillStatus.NEED_TAX_UNPAID.ToString();
        //             waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        //
        //             results.Add(
        //                 new
        //                 {
        //                     id = waybill.Id,
        //                     success = true,
        //                     message = "成功標記為未收款",
        //                 }
        //             );
        //             successCount++;
        //         }
        //         catch (Exception ex)
        //         {
        //             results.Add(
        //                 new
        //                 {
        //                     id = waybill.Id,
        //                     success = false,
        //                     message = $"標記失敗：{ex.Message}",
        //                 }
        //             );
        //             failureCount++;
        //         }
        //     }
        //
        //     // 批量保存變更
        //     try
        //     {
        //         await _context.SaveChangesAsync();
        //     }
        //     catch (Exception ex)
        //     {
        //         return StatusCode(
        //             500,
        //             new { message = $"批量標記時發生錯誤：{ex.Message}", details = results }
        //         );
        //     }
        //
        //     return Ok(
        //         new
        //         {
        //             message = $"批量標記完成：成功 {successCount} 筆，失敗 {failureCount} 筆",
        //             summary = new { total = waybillIds.Count, success = successCount, failure = failureCount },
        //             details = results,
        //         }
        //     );
        // }
    }
}
