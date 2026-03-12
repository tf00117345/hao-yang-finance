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
    public class OutstandingBalanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OutstandingBalanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/OutstandingBalance
        [HttpGet]
        [RequirePermission(Permission.InvoiceRead)]
        public async Task<ActionResult<IEnumerable<OutstandingBalanceDto>>> GetOutstandingBalances(
            [FromQuery] string? status
        )
        {
            var query = _context.OutstandingBalances
                .Include(ob => ob.Invoice)
                .Include(ob => ob.Company)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(ob => ob.Status == status);
            }

            var results = await query
                .OrderByDescending(ob => ob.CreatedAt)
                .Select(ob => new OutstandingBalanceDto
                {
                    Id = ob.Id,
                    InvoiceId = ob.InvoiceId,
                    CompanyId = ob.CompanyId,
                    CompanyName = ob.Company.Name,
                    InvoiceNumber = ob.Invoice.InvoiceNumber,
                    Amount = ob.Amount,
                    Note = ob.Note,
                    Status = ob.Status,
                    ResolvedAt = ob.ResolvedAt,
                    CreatedAt = ob.CreatedAt,
                })
                .ToListAsync();

            return Ok(results);
        }

        // GET: api/OutstandingBalance/by-company
        [HttpGet("by-company")]
        [RequirePermission(Permission.InvoiceRead)]
        public async Task<ActionResult<IEnumerable<CompanyOutstandingBalanceSummaryDto>>> GetOutstandingBalancesByCompany()
        {
            var outstandingRecords = await _context.OutstandingBalances
                .Include(ob => ob.Invoice)
                .Include(ob => ob.Company)
                .Where(ob => ob.Status == "outstanding")
                .OrderByDescending(ob => ob.CreatedAt)
                .Select(ob => new OutstandingBalanceDto
                {
                    Id = ob.Id,
                    InvoiceId = ob.InvoiceId,
                    CompanyId = ob.CompanyId,
                    CompanyName = ob.Company.Name,
                    InvoiceNumber = ob.Invoice.InvoiceNumber,
                    Amount = ob.Amount,
                    Note = ob.Note,
                    Status = ob.Status,
                    ResolvedAt = ob.ResolvedAt,
                    CreatedAt = ob.CreatedAt,
                })
                .ToListAsync();

            var grouped = outstandingRecords
                .GroupBy(r => new { r.CompanyId, r.CompanyName })
                .Select(g => new CompanyOutstandingBalanceSummaryDto
                {
                    CompanyId = g.Key.CompanyId,
                    CompanyName = g.Key.CompanyName,
                    TotalOutstanding = g.Sum(r => r.Amount),
                    Records = g.ToList(),
                })
                .OrderBy(g => g.CompanyName)
                .ToList();

            return Ok(grouped);
        }

        // POST: api/OutstandingBalance/5/resolve
        [HttpPost("{id}/resolve")]
        [RequirePermission(Permission.InvoiceMarkPaid)]
        public async Task<IActionResult> ResolveOutstandingBalance(string id)
        {
            var record = await _context.OutstandingBalances.FindAsync(id);

            if (record == null)
            {
                return NotFound(new { message = "找不到指定的欠款記錄" });
            }

            if (record.Status != "outstanding")
            {
                return BadRequest(new { message = "此欠款記錄已補齊，無法重複操作" });
            }

            record.Status = "resolved";
            record.ResolvedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            record.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return Ok(new { message = "欠款已標記為已補齊" });
        }
    }
}
