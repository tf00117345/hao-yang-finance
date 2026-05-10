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
    public class ExtraExpenseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExtraExpenseController(ApplicationDbContext context)
        {
            _context = context;
        }

        // PUT: api/ExtraExpense/{id}
        [HttpPut("{id}")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult<ExtraExpenseDto>> UpdateExtraExpense(
            string id,
            UpdateExtraExpenseRequestDto dto
        )
        {
            if (string.IsNullOrWhiteSpace(dto.Item))
            {
                return BadRequest(new { message = "品項為必填" });
            }

            var extraExpense = await _context
                .ExtraExpenses.Include(e => e.Waybill)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extraExpense == null)
            {
                return NotFound(new { message = "額外費用不存在" });
            }

            if (extraExpense.Waybill.Status == WaybillStatus.INVOICED.ToString())
            {
                return BadRequest(new { message = "已開立發票的託運單無法修改額外費用" });
            }

            extraExpense.Description = dto.Item;
            extraExpense.Amount = dto.Fee;
            extraExpense.Item = dto.Item;
            extraExpense.Fee = dto.Fee;
            extraExpense.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            return Ok(new ExtraExpenseDto
            {
                Id = extraExpense.Id,
                Item = extraExpense.Item ?? extraExpense.Description,
                Fee = extraExpense.Fee ?? extraExpense.Amount,
                Notes = extraExpense.Notes,
            });
        }

        // DELETE: api/ExtraExpense/{id}
        [HttpDelete("{id}")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult> DeleteExtraExpense(string id)
        {
            var extraExpense = await _context
                .ExtraExpenses.Include(e => e.Waybill)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extraExpense == null)
            {
                return NotFound(new { message = "額外費用不存在" });
            }

            if (extraExpense.Waybill.Status == WaybillStatus.INVOICED.ToString())
            {
                return BadRequest(new { message = "已開立發票的託運單無法刪除額外費用" });
            }

            var isReferenced = await _context.InvoiceExtraExpenses.AnyAsync(iee =>
                iee.ExtraExpenseId == id
            );
            if (isReferenced)
            {
                return Conflict(new { message = "此額外費用已被發票引用，無法刪除" });
            }

            _context.ExtraExpenses.Remove(extraExpense);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
