using Microsoft.AspNetCore.Mvc;
using hao_yang_finance_api.Services;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Attributes;
using hao_yang_finance_api.Models;
using System.Security.Claims;

namespace hao_yang_finance_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriverSettlementController : ControllerBase
    {
        private readonly DriverSettlementService _settlementService;
        private readonly ILogger<DriverSettlementController> _logger;

        public DriverSettlementController(
            DriverSettlementService settlementService,
            ILogger<DriverSettlementController> logger)
        {
            _settlementService = settlementService;
            _logger = logger;
        }

        [HttpGet]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<List<DriverSettlementSummaryDto>>> GetSettlements(
            [FromQuery] string? targetMonth = null)
        {
            try
            {
                var settlements = await _settlementService.GetSettlementsAsync(targetMonth);
                return Ok(settlements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving driver settlements");
                return StatusCode(500, new { message = "An error occurred while retrieving settlements." });
            }
        }

        [HttpGet("{settlementId}")]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<DriverSettlementDto>> GetSettlement(long settlementId)
        {
            try
            {
                var settlement = await _settlementService.GetSettlementAsync(settlementId);

                if (settlement == null)
                {
                    return NotFound(new { message = $"Settlement with ID {settlementId} not found." });
                }

                return Ok(settlement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving driver settlement {SettlementId}", settlementId);
                return StatusCode(500, new { message = "An error occurred while retrieving the settlement." });
            }
        }

        [HttpGet("driver/{driverId}")]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<DriverSettlementDto>> GetSettlementByDriverAndMonth(
            string driverId,
            [FromQuery] string targetMonth)
        {
            try
            {
                var settlement = await _settlementService.GetSettlementByDriverAndMonthAsync(driverId, targetMonth);

                if (settlement == null)
                {
                    return NotFound(new
                        { message = $"Settlement for driver {driverId} in month {targetMonth} not found." });
                }

                return Ok(settlement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving driver settlement for driver {DriverId} and month {TargetMonth}",
                    driverId, targetMonth);
                return StatusCode(500, new { message = "An error occurred while retrieving the settlement." });
            }
        }

        [HttpPost]
        [RequirePermission(Permission.DriverSettlementCreate)]
        public async Task<ActionResult<DriverSettlementDto>> CreateSettlement(
            [FromBody] CreateDriverSettlementDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var settlement = await _settlementService.CreateSettlementAsync(createDto, userId);

                return CreatedAtAction(
                    nameof(GetSettlement),
                    new { settlementId = settlement.SettlementId },
                    settlement);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating driver settlement");
                return StatusCode(500, new { message = "An error occurred while creating the settlement." });
            }
        }

        [HttpPut("{settlementId}")]
        [RequirePermission(Permission.DriverSettlementUpdate)]
        public async Task<ActionResult<DriverSettlementDto>> UpdateSettlement(
            long settlementId,
            [FromBody] UpdateDriverSettlementDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var settlement = await _settlementService.UpdateSettlementAsync(settlementId, updateDto, userId);

                return Ok(settlement);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating driver settlement {SettlementId}", settlementId);
                return StatusCode(500, new { message = "An error occurred while updating the settlement." });
            }
        }

        [HttpDelete("{settlementId}")]
        [RequirePermission(Permission.DriverSettlementDelete)]
        public async Task<ActionResult> DeleteSettlement(long settlementId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var deleted = await _settlementService.DeleteSettlementAsync(settlementId, userId);

                if (!deleted)
                {
                    return NotFound(new { message = $"Settlement with ID {settlementId} not found." });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting driver settlement {SettlementId}", settlementId);
                return StatusCode(500, new { message = "An error occurred while deleting the settlement." });
            }
        }

        [HttpGet("expense-types")]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<List<ExpenseTypeDto>>> GetExpenseTypes([FromQuery] string? category = null)
        {
            try
            {
                var expenseTypes = await _settlementService.GetExpenseTypesAsync(category);
                return Ok(expenseTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expense types");
                return StatusCode(500, new { message = "An error occurred while retrieving expense types." });
            }
        }

        [HttpGet("default-expenses/{category}")]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<List<CreateExpenseDto>>> GetDefaultExpenses(string category)
        {
            try
            {
                var expenseTypes = await _settlementService.GetDefaultExpenseTypesAsync(category);

                var defaultExpenses = expenseTypes
                    .Where(et => et.IsDefault)
                    .Select(et => new CreateExpenseDto
                    {
                        Name = et.Name,
                        Amount = et.DefaultAmount ?? 0,
                        ExpenseTypeId = et.ExpenseTypeId
                    })
                    .ToList();

                return Ok(defaultExpenses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving default expenses for category {Category}", category);
                return StatusCode(500, new { message = "An error occurred while retrieving default expenses." });
            }
        }

        [HttpPost("{settlementId}/export-pdf")]
        [RequirePermission(Permission.DriverSettlementExport)]
        public async Task<ActionResult> ExportSettlementPdf(long settlementId)
        {
            try
            {
                var settlement = await _settlementService.GetSettlementAsync(settlementId);

                if (settlement == null)
                {
                    return NotFound(new { message = $"Settlement with ID {settlementId} not found." });
                }

                // TODO: Implement PDF generation
                // For now, return the settlement data that would be used for PDF generation
                return Ok(new
                {
                    message = "PDF export will be implemented with frontend print functionality",
                    settlement = settlement
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting PDF for settlement {SettlementId}", settlementId);
                return StatusCode(500, new { message = "An error occurred while exporting PDF." });
            }
        }

        [HttpGet("expense-types/{id}")]
        [RequirePermission(Permission.DriverSettlementRead)]
        public async Task<ActionResult<ExpenseTypeDto>> GetExpenseType(int id)
        {
            try
            {
                var expenseType = await _settlementService.GetExpenseTypeByIdAsync(id);

                if (expenseType == null)
                {
                    return NotFound(new { message = $"Expense type with ID {id} not found." });
                }

                return Ok(expenseType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expense type {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the expense type." });
            }
        }

        [HttpPost("expense-types")]
        [RequirePermission(Permission.DriverSettlementCreate)]
        public async Task<ActionResult<ExpenseTypeDto>> CreateExpenseType([FromBody] CreateExpenseTypeDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var expenseType = await _settlementService.CreateExpenseTypeAsync(createDto, userId);

                return CreatedAtAction(
                    nameof(GetExpenseType),
                    new { id = expenseType.ExpenseTypeId },
                    expenseType);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating expense type");
                return StatusCode(500, new { message = "An error occurred while creating the expense type." });
            }
        }

        [HttpPut("expense-types/{id}")]
        [RequirePermission(Permission.DriverSettlementUpdate)]
        public async Task<ActionResult<ExpenseTypeDto>> UpdateExpenseType(
            int id,
            [FromBody] UpdateExpenseTypeDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var expenseType = await _settlementService.UpdateExpenseTypeAsync(id, updateDto, userId);

                return Ok(expenseType);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating expense type {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the expense type." });
            }
        }

        [HttpDelete("expense-types/{id}")]
        [RequirePermission(Permission.DriverSettlementDelete)]
        public async Task<ActionResult> DeleteExpenseType(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var deleted = await _settlementService.DeleteExpenseTypeAsync(id, userId);

                if (!deleted)
                {
                    return NotFound(new { message = $"Expense type with ID {id} not found." });
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting expense type {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the expense type." });
            }
        }
    }
}