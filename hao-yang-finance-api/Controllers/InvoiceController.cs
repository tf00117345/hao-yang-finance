using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;

namespace hao_yang_finance_api.Controllers
{
    // Status flow: issued → paid → void
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoiceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Invoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? companyId,
            [FromQuery] string? status,
            [FromQuery] string? invoiceNumber)
        {
            var query = _context.Invoices
                .Include(i => i.Company)
                .Include(i => i.InvoiceWaybills)
                .ThenInclude(iw => iw.Waybill)
                .ThenInclude(w => w.Driver)
                .Include(i => i.InvoiceExtraExpenses)
                .ThenInclude(iee => iee.ExtraExpense)
                .ThenInclude(ee => ee.Waybill)
                .AsQueryable();

            // 日期範圍篩選
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                var startDateString = start.ToString("yyyy-MM-dd");
                query = query.Where(i => i.Date.CompareTo(startDateString) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                var endDateString = end.ToString("yyyy-MM-dd");
                query = query.Where(i => i.Date.CompareTo(endDateString) <= 0);
            }

            // 公司篩選
            if (!string.IsNullOrEmpty(companyId))
            {
                query = query.Where(i => i.CompanyId == companyId);
            }

            // 狀態篩選
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            // 發票號碼篩選
            if (!string.IsNullOrEmpty(invoiceNumber))
            {
                query = query.Where(i => i.InvoiceNumber.Contains(invoiceNumber));
            }

            var invoices = await query
                .OrderByDescending(i => i.Date)
                .ThenByDescending(i => i.CreatedAt)
                .ToListAsync();

            var result = invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                Date = i.Date,
                CompanyId = i.CompanyId,
                CompanyName = i.Company.Name,
                Subtotal = i.Subtotal,
                TaxRate = i.TaxRate,
                ExtraExpensesIncludeTax = i.ExtraExpensesIncludeTax,
                Tax = i.Tax,
                Total = i.Total,
                Status = i.Status,
                PaymentMethod = i.PaymentMethod,
                PaymentNote = i.PaymentNote,
                Notes = i.Notes,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt,
                PaidAt = i.PaidAt,
                Waybills = i.InvoiceWaybills
                    .Select(iw => new InvoiceWaybillDto
                    {
                        WaybillId = iw.WaybillId,
                        WaybillNumber = iw.Waybill.WaybillNumber,
                        Date = iw.Waybill.Date,
                        Item = iw.Waybill.Item,
                        Fee = iw.Waybill.Fee,
                        DriverName = iw.Waybill.Driver?.Name ?? "",
                        ExtraExpensesIncludeTax = i.ExtraExpensesIncludeTax,
                        ExtraExpenses = i.InvoiceExtraExpenses
                            .Where(iee => iee.ExtraExpense.WaybillId == iw.WaybillId)
                            .Select(iee => new InvoiceExtraExpenseDto
                            {
                                ExtraExpenseId = iee.ExtraExpenseId,
                                Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                                Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                                Notes = iee.ExtraExpense.Notes,
                                WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                            }).ToList()
                    })
                    .OrderBy(x => x.WaybillNumber)
                    .ToList(),
                // ExtraExpenses = i.InvoiceExtraExpenses.Select(iee => new InvoiceExtraExpenseDto
                // {
                //     ExtraExpenseId = iee.ExtraExpenseId,
                //     Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                //     Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                //     Notes = iee.ExtraExpense.Notes,
                //     WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                // }).ToList()
            }).ToList();

            return Ok(result);
        }

        // GET: api/Invoice/5
        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto>> GetInvoice(string id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Company)
                .Include(i => i.InvoiceWaybills)
                .ThenInclude(iw => iw.Waybill)
                .ThenInclude(w => w.Driver)
                .Include(i => i.InvoiceExtraExpenses)
                .ThenInclude(iee => iee.ExtraExpense)
                .ThenInclude(ee => ee.Waybill)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            var result = new InvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                Date = invoice.Date,
                CompanyId = invoice.CompanyId,
                CompanyName = invoice.Company.Name,
                Subtotal = invoice.Subtotal,
                TaxRate = invoice.TaxRate,
                ExtraExpensesIncludeTax = invoice.ExtraExpensesIncludeTax,
                Tax = invoice.Tax,
                Total = invoice.Total,
                Status = invoice.Status,
                PaymentMethod = invoice.PaymentMethod,
                PaymentNote = invoice.PaymentNote,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt,
                UpdatedAt = invoice.UpdatedAt,
                PaidAt = invoice.PaidAt,
                Waybills = invoice.InvoiceWaybills.Select(iw => new InvoiceWaybillDto
                {
                    WaybillId = iw.WaybillId,
                    WaybillNumber = iw.Waybill.WaybillNumber,
                    Date = iw.Waybill.Date,
                    Item = iw.Waybill.Item,
                    Fee = iw.Waybill.Fee,
                    DriverName = iw.Waybill.Driver?.Name ?? "",
                    ExtraExpensesIncludeTax = invoice.ExtraExpensesIncludeTax,
                    ExtraExpenses = invoice.InvoiceExtraExpenses
                        .Where(iee => iee.ExtraExpense.WaybillId == iw.WaybillId)
                        .Select(iee => new InvoiceExtraExpenseDto
                        {
                            ExtraExpenseId = iee.ExtraExpenseId,
                            Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                            Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                            Notes = iee.ExtraExpense.Notes,
                            WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                        }).ToList()
                }).ToList(),
                ExtraExpenses = invoice.InvoiceExtraExpenses.Select(iee => new InvoiceExtraExpenseDto
                {
                    ExtraExpenseId = iee.ExtraExpenseId,
                    Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                    Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                    Notes = iee.ExtraExpense.Notes,
                    WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                }).ToList()
            };

            return Ok(result);
        }

        // POST: api/Invoice
        [HttpPost]
        public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto createInvoiceDto)
        {
            // 驗證發票號碼唯一性
            var existingInvoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceNumber == createInvoiceDto.InvoiceNumber.Trim());

            if (existingInvoice != null)
            {
                return Conflict(new { message = "此發票號碼已存在" });
            }

            // 驗證公司存在
            var company = await _context.Companies.FindAsync(createInvoiceDto.CompanyId);
            if (company == null || !company.IsActive)
            {
                return BadRequest(new { message = "無效的公司ID或公司已停用" });
            }

            // 驗證託運單存在且狀態為 PENDING
            var waybills = await _context.Waybills
                .Where(w => createInvoiceDto.WaybillIds.Contains(w.Id))
                .ToListAsync();

            if (waybills.Count != createInvoiceDto.WaybillIds.Count)
            {
                return BadRequest(new { message = "部分託運單不存在" });
            }

            var nonPendingWaybills = waybills.Where(w => w.Status != "PENDING").ToList();
            if (nonPendingWaybills.Any())
            {
                var waybillNumbers = string.Join(", ", nonPendingWaybills.Select(w => w.WaybillNumber));
                return BadRequest(new { message = $"以下託運單狀態不是 PENDING，無法開立發票：{waybillNumbers}" });
            }

            // 驗證額外費用存在且屬於選定的託運單
            var extraExpenses = new List<ExtraExpense>();
            if (createInvoiceDto.ExtraExpenseIds.Any())
            {
                extraExpenses = await _context.ExtraExpenses
                    .Where(ee => createInvoiceDto.ExtraExpenseIds.Contains(ee.Id) &&
                                 createInvoiceDto.WaybillIds.Contains(ee.WaybillId))
                    .ToListAsync();

                if (extraExpenses.Count != createInvoiceDto.ExtraExpenseIds.Count)
                {
                    return BadRequest(new { message = "部分額外費用不存在或不屬於選定的託運單" });
                }
            }

            // 計算金額
            var waybillAmount = waybills.Sum(w => w.Fee);
            var extraExpenseAmount = extraExpenses.Sum(ee => ee.Fee ?? ee.Amount);

            decimal subtotal, tax, total;

            if (createInvoiceDto.ExtraExpensesIncludeTax)
            {
                // 額外費用包含稅率：稅額 = (託運單金額 + 額外費用) × 稅率
                subtotal = waybillAmount + extraExpenseAmount;
                tax = subtotal * createInvoiceDto.TaxRate;
                total = subtotal + tax;
            }
            else
            {
                // 額外費用不包含稅率：稅額 = 託運單金額 × 稅率
                subtotal = waybillAmount + extraExpenseAmount;
                tax = waybillAmount * createInvoiceDto.TaxRate;
                total = subtotal + tax;
            }

            // 建立發票
            var invoice = new Invoice
            {
                InvoiceNumber = createInvoiceDto.InvoiceNumber.Trim(),
                Date = createInvoiceDto.Date,
                CompanyId = createInvoiceDto.CompanyId,
                Subtotal = subtotal,
                TaxRate = createInvoiceDto.TaxRate,
                ExtraExpensesIncludeTax = createInvoiceDto.ExtraExpensesIncludeTax,
                Tax = tax,
                Total = total,
                Status = "issued",
                Notes = createInvoiceDto.Notes?.Trim()
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // 新增發票託運單關聯
            foreach (var waybillId in createInvoiceDto.WaybillIds)
            {
                var invoiceWaybill = new InvoiceWaybill
                {
                    InvoiceId = invoice.Id,
                    WaybillId = waybillId
                };
                _context.InvoiceWaybills.Add(invoiceWaybill);
            }

            // 新增發票額外費用關聯
            foreach (var extraExpenseId in createInvoiceDto.ExtraExpenseIds)
            {
                var invoiceExtraExpense = new InvoiceExtraExpense
                {
                    InvoiceId = invoice.Id,
                    ExtraExpenseId = extraExpenseId
                };
                _context.InvoiceExtraExpenses.Add(invoiceExtraExpense);
            }

            // 更新託運單狀態為 INVOICED
            foreach (var waybill in waybills)
            {
                waybill.Status = "INVOICED";
                waybill.InvoiceId = invoice.Id;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            await _context.SaveChangesAsync();

            // 重新載入完整資料
            var createdInvoice = await _context.Invoices
                .Include(i => i.Company)
                .Include(i => i.InvoiceWaybills)
                .ThenInclude(iw => iw.Waybill)
                .ThenInclude(w => w.Driver)
                .Include(i => i.InvoiceExtraExpenses)
                .ThenInclude(iee => iee.ExtraExpense)
                .ThenInclude(ee => ee.Waybill)
                .FirstOrDefaultAsync(i => i.Id == invoice.Id);

            var response = new InvoiceDto
            {
                Id = createdInvoice!.Id,
                InvoiceNumber = createdInvoice.InvoiceNumber,
                Date = createdInvoice.Date,
                CompanyId = createdInvoice.CompanyId,
                CompanyName = createdInvoice.Company.Name,
                Subtotal = createdInvoice.Subtotal,
                TaxRate = createdInvoice.TaxRate,
                ExtraExpensesIncludeTax = createdInvoice.ExtraExpensesIncludeTax,
                Tax = createdInvoice.Tax,
                Total = createdInvoice.Total,
                Status = createdInvoice.Status,
                PaymentMethod = createdInvoice.PaymentMethod,
                PaymentNote = createdInvoice.PaymentNote,
                Notes = createdInvoice.Notes,
                CreatedAt = createdInvoice.CreatedAt,
                UpdatedAt = createdInvoice.UpdatedAt,
                PaidAt = createdInvoice.PaidAt,
                Waybills = createdInvoice.InvoiceWaybills.Select(iw => new InvoiceWaybillDto
                {
                    WaybillId = iw.WaybillId,
                    WaybillNumber = iw.Waybill.WaybillNumber,
                    Date = iw.Waybill.Date,
                    Item = iw.Waybill.Item,
                    Fee = iw.Waybill.Fee,
                    DriverName = iw.Waybill.Driver?.Name ?? "",
                    ExtraExpensesIncludeTax = createdInvoice.ExtraExpensesIncludeTax,
                    ExtraExpenses = createdInvoice.InvoiceExtraExpenses
                        .Where(iee => iee.ExtraExpense.WaybillId == iw.WaybillId)
                        .Select(iee => new InvoiceExtraExpenseDto
                        {
                            ExtraExpenseId = iee.ExtraExpenseId,
                            Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                            Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                            Notes = iee.ExtraExpense.Notes,
                            WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                        }).ToList()
                }).ToList(),
                ExtraExpenses = createdInvoice.InvoiceExtraExpenses.Select(iee => new InvoiceExtraExpenseDto
                {
                    ExtraExpenseId = iee.ExtraExpenseId,
                    Item = iee.ExtraExpense.Item ?? iee.ExtraExpense.Description,
                    Fee = iee.ExtraExpense.Fee ?? iee.ExtraExpense.Amount,
                    Notes = iee.ExtraExpense.Notes,
                    WaybillNumber = iee.ExtraExpense.Waybill.WaybillNumber
                }).ToList()
            };

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, response);
        }

        // PUT: api/Invoice/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(string id, UpdateInvoiceDto updateInvoiceDto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceWaybills)
                .Include(i => i.InvoiceExtraExpenses)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            // 檢查狀態：只有 issued 狀態可以編輯
            if (invoice.Status != "issued")
            {
                return BadRequest(new { message = $"無法編輯狀態為 '{invoice.Status}' 的發票，只有 'issued' 狀態的發票可以編輯" });
            }

            // 驗證發票號碼唯一性（排除當前發票）
            var existingInvoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceNumber == updateInvoiceDto.InvoiceNumber.Trim() && i.Id != id);

            if (existingInvoice != null)
            {
                return Conflict(new { message = "此發票號碼已存在" });
            }

            // 驗證託運單存在且狀態為 PENDING 或 INVOICED（且關聯到當前發票）
            var waybills = await _context.Waybills
                .Where(w => updateInvoiceDto.WaybillIds.Contains(w.Id))
                .ToListAsync();

            if (waybills.Count != updateInvoiceDto.WaybillIds.Count)
            {
                return BadRequest(new { message = "部分託運單不存在" });
            }

            var invalidWaybills = waybills.Where(w =>
                w.Status != "PENDING" &&
                !(w.Status == "INVOICED" && w.InvoiceId == id)).ToList();

            if (invalidWaybills.Any())
            {
                var waybillNumbers = string.Join(", ", invalidWaybills.Select(w => w.WaybillNumber));
                return BadRequest(new { message = $"以下託運單狀態無效：{waybillNumbers}" });
            }

            // 驗證額外費用存在且屬於選定的託運單
            var extraExpenses = new List<ExtraExpense>();
            if (updateInvoiceDto.ExtraExpenseIds.Any())
            {
                extraExpenses = await _context.ExtraExpenses
                    .Where(ee => updateInvoiceDto.ExtraExpenseIds.Contains(ee.Id) &&
                                 updateInvoiceDto.WaybillIds.Contains(ee.WaybillId))
                    .ToListAsync();

                if (extraExpenses.Count != updateInvoiceDto.ExtraExpenseIds.Count)
                {
                    return BadRequest(new { message = "部分額外費用不存在或不屬於選定的託運單" });
                }
            }

            // 計算金額
            var waybillAmount = waybills.Sum(w => w.Fee);
            var extraExpenseAmount = extraExpenses.Sum(ee => ee.Fee ?? ee.Amount);

            decimal subtotal, tax, total;

            if (updateInvoiceDto.ExtraExpensesIncludeTax)
            {
                subtotal = waybillAmount + extraExpenseAmount;
                tax = subtotal * updateInvoiceDto.TaxRate;
                total = subtotal + tax;
            }
            else
            {
                subtotal = waybillAmount + extraExpenseAmount;
                tax = waybillAmount * updateInvoiceDto.TaxRate;
                total = subtotal + tax;
            }

            // 先移除舊的關聯
            _context.InvoiceWaybills.RemoveRange(invoice.InvoiceWaybills);
            _context.InvoiceExtraExpenses.RemoveRange(invoice.InvoiceExtraExpenses);

            // 重置原本關聯託運單的狀態為 PENDING
            var oldWaybills = await _context.Waybills
                .Where(w => w.InvoiceId == id)
                .ToListAsync();

            foreach (var oldWaybill in oldWaybills)
            {
                oldWaybill.Status = "PENDING";
                oldWaybill.InvoiceId = null;
                oldWaybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            // 更新發票資料
            invoice.InvoiceNumber = updateInvoiceDto.InvoiceNumber.Trim();
            invoice.Date = updateInvoiceDto.Date;
            invoice.TaxRate = updateInvoiceDto.TaxRate;
            invoice.ExtraExpensesIncludeTax = updateInvoiceDto.ExtraExpensesIncludeTax;
            invoice.Subtotal = subtotal;
            invoice.Tax = tax;
            invoice.Total = total;
            invoice.Notes = updateInvoiceDto.Notes?.Trim();
            invoice.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            // 新增新的關聯
            foreach (var waybillId in updateInvoiceDto.WaybillIds)
            {
                var invoiceWaybill = new InvoiceWaybill
                {
                    InvoiceId = invoice.Id,
                    WaybillId = waybillId
                };
                _context.InvoiceWaybills.Add(invoiceWaybill);
            }

            foreach (var extraExpenseId in updateInvoiceDto.ExtraExpenseIds)
            {
                var invoiceExtraExpense = new InvoiceExtraExpense
                {
                    InvoiceId = invoice.Id,
                    ExtraExpenseId = extraExpenseId
                };
                _context.InvoiceExtraExpenses.Add(invoiceExtraExpense);
            }

            // 更新新託運單狀態為 INVOICED
            foreach (var waybill in waybills)
            {
                waybill.Status = "INVOICED";
                waybill.InvoiceId = invoice.Id;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Invoice/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(string id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceWaybills)
                .Include(i => i.InvoiceExtraExpenses)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            // 檢查狀態：只有 issued 和 void 狀態可以刪除
            if (invoice.Status is not ("issued" or "void")) return BadRequest(new { message = $"只有作廢和已開立狀態的發票可以刪除" });

            // 恢復關聯託運單的狀態為 PENDING
            var waybills = await _context.Waybills
                .Where(w => w.InvoiceId == id)
                .ToListAsync();

            foreach (var waybill in waybills)
            {
                waybill.Status = "PENDING";
                waybill.InvoiceId = null;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            // 刪除關聯資料
            _context.InvoiceWaybills.RemoveRange(invoice.InvoiceWaybills);
            _context.InvoiceExtraExpenses.RemoveRange(invoice.InvoiceExtraExpenses);

            // 刪除發票
            _context.Invoices.Remove(invoice);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/Invoice/5/mark-paid
        [HttpPost("{id}/mark-paid")]
        public async Task<IActionResult> MarkInvoicePaid(string id, MarkInvoicePaidDto markPaidDto)
        {
            var invoice = await _context.Invoices.FindAsync(id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            // 檢查狀態：只有 issued 狀態可以標記為已收款
            if (invoice.Status != "issued")
            {
                return BadRequest(new { message = $"無法標記狀態為 '{invoice.Status}' 的發票為已收款，只有 'issued' 狀態的發票可以標記" });
            }

            invoice.Status = "paid";
            invoice.PaymentMethod = markPaidDto.PaymentMethod.Trim();
            invoice.PaymentNote = markPaidDto.PaymentNote?.Trim();
            invoice.PaidAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            invoice.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "發票已成功標記為已收款" });
        }

        // POST: api/Invoice/5/void
        [HttpPost("{id}/void")]
        public async Task<IActionResult> VoidInvoice(string id)
        {
            var invoice = await _context.Invoices.FindAsync(id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            // 檢查狀態：issued 和 paid 狀態都可以作廢
            if (invoice.Status != "issued" && invoice.Status != "paid")
            {
                return BadRequest(new { message = $"無法作廢狀態為 '{invoice.Status}' 的發票" });
            }

            // 恢復關聯託運單的狀態為 PENDING
            var waybills = await _context.Waybills
                .Where(w => w.InvoiceId == id)
                .ToListAsync();

            foreach (var waybill in waybills)
            {
                waybill.Status = "PENDING";
                waybill.InvoiceId = null;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            invoice.Status = "void";
            invoice.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "發票已成功作廢" });
        }

        // POST: api/Invoice/5/restore
        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreInvoice(string id)
        {
            var invoice = await _context.Invoices.FindAsync(id);

            if (invoice == null)
            {
                return NotFound(new { message = "找不到指定的發票" });
            }

            invoice.Status = "issued";
            invoice.PaymentMethod = null;
            invoice.PaymentNote = null;
            invoice.PaidAt = null;
            invoice.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            // 恢復關聯託運單的狀態為 INVOICED
            var waybills = await _context.Waybills
                .Where(w => w.InvoiceId == id)
                .ToListAsync();

            foreach (var waybill in waybills)
            {
                waybill.Status = "INVOICED";
                waybill.InvoiceId = invoice.Id;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "發票已成功恢復" });
        }

        // GET: api/Invoice/stats
        [HttpGet("stats")]
        public async Task<ActionResult<InvoiceStatsDto>> GetInvoiceStats(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate)
        {
            var query = _context.Invoices.AsQueryable();

            // 日期範圍篩選
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                var startDateString = start.ToString("yyyy-MM-dd");
                query = query.Where(i => i.Date.CompareTo(startDateString) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                var endDateString = end.ToString("yyyy-MM-dd");
                query = query.Where(i => i.Date.CompareTo(endDateString) <= 0);
            }

            var invoices = await query.ToListAsync();

            var stats = new InvoiceStatsDto
            {
                TotalInvoices = invoices.Count,
                PaidInvoices = invoices.Count(i => i.Status == "paid"),
                UnpaidInvoices = invoices.Count(i => i.Status == "issued"),
                VoidInvoices = invoices.Count(i => i.Status == "void"),
                TotalAmount = invoices.Where(i => i.Status != "void").Sum(i => i.Total),
                PaidAmount = invoices.Where(i => i.Status == "paid").Sum(i => i.Total),
                UnpaidAmount = invoices.Where(i => i.Status == "issued").Sum(i => i.Total)
            };

            return Ok(stats);
        }
    }
}