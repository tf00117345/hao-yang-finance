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
    public class CollectionRequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CollectionRequestController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CollectionRequest
        [HttpGet]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<IEnumerable<CollectionRequestDto>>> GetCollectionRequests(
            [FromQuery] string? companyId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null
        )
        {
            var query = _context
                .CollectionRequests.Include(cr => cr.Company)
                .Include(cr => cr.Waybills)
                .AsQueryable();

            if (!string.IsNullOrEmpty(companyId))
            {
                query = query.Where(cr => cr.CompanyId == companyId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(cr => cr.Status == status);
            }

            if (!string.IsNullOrEmpty(startDate))
            {
                query = query.Where(cr => string.Compare(cr.RequestDate, startDate) >= 0);
            }

            if (!string.IsNullOrEmpty(endDate))
            {
                query = query.Where(cr => string.Compare(cr.RequestDate, endDate) <= 0);
            }

            var collectionRequests = await query
                .OrderByDescending(cr => cr.RequestDate)
                .ThenByDescending(cr => cr.CreatedAt)
                .ToListAsync();

            var result = collectionRequests
                .Select(cr => new CollectionRequestDto
                {
                    Id = cr.Id,
                    RequestNumber = cr.RequestNumber,
                    RequestDate = cr.RequestDate,
                    CompanyId = cr.CompanyId,
                    CompanyName = cr.Company.Name,
                    TotalAmount = cr.TotalAmount,
                    Subtotal = cr.Subtotal,
                    TaxAmount = cr.TaxAmount,
                    TaxRate = cr.TaxRate,
                    Status = cr.Status,
                    Notes = cr.Notes,
                    PaymentReceivedAt = cr.PaymentReceivedAt,
                    PaymentMethod = cr.PaymentMethod,
                    PaymentNotes = cr.PaymentNotes,
                    WaybillCount = cr.Waybills.Count,
                    WaybillIds = cr.Waybills.Select(w => w.Id).ToList(),
                    CreatedAt = cr.CreatedAt,
                    UpdatedAt = cr.UpdatedAt,
                })
                .ToList();

            return Ok(result);
        }

        // GET: api/CollectionRequest/5
        [HttpGet("{id}")]
        [RequirePermission(Permission.WaybillRead)]
        public async Task<ActionResult<CollectionRequestDetailDto>> GetCollectionRequest(string id)
        {
            var collectionRequest = await _context
                .CollectionRequests.Include(cr => cr.Company)
                .Include(cr => cr.Waybills)
                .ThenInclude(w => w.Driver)
                .Include(cr => cr.Waybills)
                .ThenInclude(w => w.Company)
                .FirstOrDefaultAsync(cr => cr.Id == id);

            if (collectionRequest == null)
            {
                return NotFound(new { message = "找不到指定的請款單" });
            }

            var result = new CollectionRequestDetailDto
            {
                Id = collectionRequest.Id,
                RequestNumber = collectionRequest.RequestNumber,
                RequestDate = collectionRequest.RequestDate,
                CompanyId = collectionRequest.CompanyId,
                CompanyName = collectionRequest.Company.Name,
                TotalAmount = collectionRequest.TotalAmount,
                Subtotal = collectionRequest.Subtotal,
                TaxAmount = collectionRequest.TaxAmount,
                TaxRate = collectionRequest.TaxRate,
                Status = collectionRequest.Status,
                Notes = collectionRequest.Notes,
                PaymentReceivedAt = collectionRequest.PaymentReceivedAt,
                PaymentMethod = collectionRequest.PaymentMethod,
                PaymentNotes = collectionRequest.PaymentNotes,
                WaybillCount = collectionRequest.Waybills.Count,
                WaybillIds = collectionRequest.Waybills.Select(w => w.Id).ToList(),
                Waybills = collectionRequest
                    .Waybills.Select(w => new CollectionRequestWaybillDto
                    {
                        Id = w.Id,
                        Date = w.Date,
                        Item = w.Item,
                        Fee = w.Fee,
                        TaxAmount = w.TaxAmount,
                        DriverName = w.Driver?.Name ?? "",
                        PlateNumber = w.PlateNumber,
                        CompanyId = w.CompanyId,
                        CompanyName = w.Company?.Name ?? "",
                    })
                    .ToList(),
                CreatedAt = collectionRequest.CreatedAt,
                UpdatedAt = collectionRequest.UpdatedAt,
            };

            return Ok(result);
        }

        // POST: api/CollectionRequest
        [HttpPost]
        [RequirePermission(Permission.WaybillCreate)]
        public async Task<ActionResult<CollectionRequestDto>> CreateCollectionRequest(
            CreateCollectionRequestDto createDto
        )
        {
            if (!createDto.WaybillIds.Any())
            {
                return BadRequest(new { message = "請至少選擇一筆託運單" });
            }

            // Validate all waybills exist and are in PENDING status
            var waybills = await _context
                .Waybills.Include(w => w.Company)
                .Where(w => createDto.WaybillIds.Contains(w.Id))
                .ToListAsync();

            if (waybills.Count != createDto.WaybillIds.Count)
            {
                return BadRequest(new { message = "部分託運單不存在" });
            }

            var invalidWaybills = waybills
                .Where(w => w.Status != WaybillStatus.PENDING.ToString())
                .ToList();

            if (invalidWaybills.Any())
            {
                return BadRequest(
                    new
                    {
                        message = $"以下託運單狀態不是 PENDING，無法請款",
                        invalidWaybillIds = invalidWaybills.Select(w => w.Id).ToList(),
                    }
                );
            }

            // Validate company exists
            var company = await _context.Companies.FindAsync(createDto.CompanyId);
            if (company == null || !company.IsActive)
            {
                return BadRequest(new { message = "無效的公司ID或公司已停用" });
            }

            // Generate request number if not provided
            var requestNumber = createDto.RequestNumber;
            if (string.IsNullOrEmpty(requestNumber))
            {
                // Generate unique request number: CR-YYYYMMDD-XXX
                var today = DateTime.Now.ToString("yyyyMMdd");
                var todayCount = await _context.CollectionRequests.CountAsync(cr =>
                    cr.RequestNumber.StartsWith($"CR-{today}-")
                );
                requestNumber = $"CR-{today}-{(todayCount + 1):D3}";
            }

            // Check if request number already exists
            var existingRequest = await _context.CollectionRequests.FirstOrDefaultAsync(cr =>
                cr.RequestNumber == requestNumber
            );
            if (existingRequest != null)
            {
                return BadRequest(new { message = $"請款單號 '{requestNumber}' 已存在" });
            }

            // Calculate totals
            decimal subtotal = waybills.Sum(w => w.Fee);
            decimal taxAmount = 0;
            decimal totalAmount = subtotal + taxAmount;

            // Create collection request
            var collectionRequest = new CollectionRequest
            {
                RequestNumber = requestNumber,
                RequestDate = createDto.RequestDate,
                CompanyId = createDto.CompanyId,
                TotalAmount = totalAmount,
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                TaxRate = 0,
                Status = CollectionRequestStatus.Requested,
                Notes = createDto.Notes,
            };

            _context.CollectionRequests.Add(collectionRequest);

            // Update waybills
            // Set status to NEED_TAX_UNPAID (collection requested but payment not received)
            foreach (var waybill in waybills)
            {
                waybill.Status = WaybillStatus.NEED_TAX_UNPAID.ToString();
                waybill.CollectionRequestId = collectionRequest.Id;
                waybill.TaxAmount = waybill.Fee * 0.05m;
                waybill.TaxRate = 0.05m;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            await _context.SaveChangesAsync();

            var result = new CollectionRequestDto
            {
                Id = collectionRequest.Id,
                RequestNumber = collectionRequest.RequestNumber,
                RequestDate = collectionRequest.RequestDate,
                CompanyId = collectionRequest.CompanyId,
                CompanyName = company.Name,
                TotalAmount = collectionRequest.TotalAmount,
                Subtotal = collectionRequest.Subtotal,
                TaxAmount = collectionRequest.TaxAmount,
                TaxRate = collectionRequest.TaxRate,
                Status = collectionRequest.Status,
                Notes = collectionRequest.Notes,
                WaybillCount = waybills.Count,
                WaybillIds = waybills.Select(w => w.Id).ToList(),
                CreatedAt = collectionRequest.CreatedAt,
                UpdatedAt = collectionRequest.UpdatedAt,
            };

            return CreatedAtAction(
                nameof(GetCollectionRequest),
                new { id = collectionRequest.Id },
                result
            );
        }

        // POST: api/CollectionRequest/5/mark-paid
        [HttpPost("{id}/mark-paid")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult<BatchOperationResultDto>> MarkCollectionPaid(
            string id,
            MarkCollectionPaidDto markPaidDto
        )
        {
            var collectionRequest = await _context
                .CollectionRequests.Include(cr => cr.Waybills)
                .FirstOrDefaultAsync(cr => cr.Id == id);

            if (collectionRequest == null)
            {
                return NotFound(new { message = "找不到指定的請款單" });
            }

            // Validate status
            if (collectionRequest.Status != CollectionRequestStatus.Requested)
            {
                return BadRequest(
                    new
                    {
                        message = $"無法標記狀態為 '{collectionRequest.Status}' 的請款單為已收款，只有 'requested' 狀態可標記",
                    }
                );
            }

            // Update collection request
            collectionRequest.Status = CollectionRequestStatus.Paid;
            collectionRequest.PaymentReceivedAt = markPaidDto.PaymentReceivedAt;
            collectionRequest.PaymentMethod = markPaidDto.PaymentMethod;
            collectionRequest.PaymentNotes = markPaidDto.PaymentNotes;
            collectionRequest.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            var details = new List<BatchOperationDetailDto>();

            // Update related waybills
            foreach (var waybill in collectionRequest.Waybills)
            {
                try
                {
                    waybill.Status = WaybillStatus.NEED_TAX_PAID.ToString();
                    waybill.PaymentReceivedAt = markPaidDto.PaymentReceivedAt;
                    waybill.PaymentMethod = markPaidDto.PaymentMethod;
                    waybill.PaymentNotes = markPaidDto.PaymentNotes;
                    waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                    details.Add(
                        new BatchOperationDetailDto
                        {
                            WaybillId = waybill.Id,
                            Success = true,
                            Message = "託運單已標記為已收款",
                        }
                    );
                }
                catch (Exception ex)
                {
                    details.Add(
                        new BatchOperationDetailDto
                        {
                            WaybillId = waybill.Id,
                            Success = false,
                            Message = $"更新託運單失敗: {ex.Message}",
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            return Ok(
                new BatchOperationResultDto
                {
                    Message = "請款單已標記為已收款",
                    CollectionRequestId = collectionRequest.Id,
                    AffectedWaybills = collectionRequest.Waybills.Count,
                    Details = details,
                }
            );
        }

        // POST: api/CollectionRequest/5/cancel
        // [HttpPost("{id}/cancel")]
        // [RequirePermission(Permission.WaybillUpdate)]
        // public async Task<ActionResult<BatchOperationResultDto>> CancelCollectionRequest(
        //     string id,
        //     CancelCollectionRequestDto cancelDto
        // )
        // {
        //     var collectionRequest = await _context
        //         .CollectionRequests.Include(cr => cr.Waybills)
        //         .FirstOrDefaultAsync(cr => cr.Id == id);
        //
        //     if (collectionRequest == null)
        //     {
        //         return NotFound(new { message = "找不到指定的請款單" });
        //     }
        //
        //     // Validate status
        //     if (collectionRequest.Status != CollectionRequestStatus.Requested)
        //     {
        //         return BadRequest(
        //             new
        //             {
        //                 message = $"無法取消狀態為 '{collectionRequest.Status}' 的請款單，只有 'requested' 狀態可取消",
        //             }
        //         );
        //     }
        //
        //     // Update collection request
        //     collectionRequest.Status = CollectionRequestStatus.Cancelled;
        //     collectionRequest.Notes = string.IsNullOrEmpty(cancelDto.CancelReason)
        //         ? collectionRequest.Notes
        //         : $"{collectionRequest.Notes}\n取消原因: {cancelDto.CancelReason}";
        //     collectionRequest.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        //
        //     var details = new List<BatchOperationDetailDto>();
        //
        //     // Restore related waybills to PENDING
        //     foreach (var waybill in collectionRequest.Waybills)
        //     {
        //         try
        //         {
        //             waybill.Status = WaybillStatus.PENDING.ToString();
        //             waybill.CollectionRequestId = null;
        //             waybill.TaxAmount = null;
        //             waybill.TaxRate = 0.05m;
        //             waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        //
        //             details.Add(
        //                 new BatchOperationDetailDto
        //                 {
        //                     WaybillId = waybill.Id,
        //                     Success = true,
        //                     Message = "託運單已還原為待處理狀態",
        //                 }
        //             );
        //         }
        //         catch (Exception ex)
        //         {
        //             details.Add(
        //                 new BatchOperationDetailDto
        //                 {
        //                     WaybillId = waybill.Id,
        //                     Success = false,
        //                     Message = $"還原託運單失敗: {ex.Message}",
        //                 }
        //             );
        //         }
        //     }
        //
        //     await _context.SaveChangesAsync();
        //
        //     return Ok(
        //         new BatchOperationResultDto
        //         {
        //             Message = "請款單已取消",
        //             CollectionRequestId = collectionRequest.Id,
        //             AffectedWaybills = collectionRequest.Waybills.Count,
        //             Details = details,
        //         }
        //     );
        // }

        // DELETE: api/CollectionRequest/5
        [HttpDelete("{id}")]
        [RequirePermission(Permission.WaybillDelete)]
        public async Task<IActionResult> DeleteCollectionRequest(string id)
        {
            var collectionRequest = await _context
                .CollectionRequests.Include(cr => cr.Waybills)
                .FirstOrDefaultAsync(cr => cr.Id == id);

            if (collectionRequest == null)
            {
                return NotFound(new { message = "找不到指定的請款單" });
            }

            // Restore related waybills to PENDING before deleting
            foreach (var waybill in collectionRequest.Waybills)
            {
                waybill.Status = WaybillStatus.PENDING.ToString();
                waybill.CollectionRequestId = null;
                waybill.TaxAmount = null;
                waybill.TaxRate = 0.05m;
                waybill.PaymentReceivedAt = null;
                waybill.PaymentMethod = null;
                waybill.PaymentNotes = null;
                waybill.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            _context.CollectionRequests.Remove(collectionRequest);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
