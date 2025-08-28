using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Attributes;
using hao_yang_finance_api.Services;

namespace hao_yang_finance_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DriverController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DriverController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Driver
        [HttpGet]
        [RequirePermission(Permission.DriverRead)]
        public async Task<ActionResult<IEnumerable<DriverDto>>> GetDrivers()
        {
            var drivers = await _context.Drivers
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => new DriverDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Phone = d.Phone,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync();

            return Ok(drivers);
        }

        // GET: api/Driver/5
        [HttpGet("{id}")]
        [RequirePermission(Permission.DriverRead)]
        public async Task<ActionResult<DriverDto>> GetDriver(string id)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null || !driver.IsActive)
            {
                return NotFound();
            }

            var driverDto = new DriverDto
            {
                Id = driver.Id,
                Name = driver.Name,
                Phone = driver.Phone,
                IsActive = driver.IsActive,
                CreatedAt = driver.CreatedAt,
                UpdatedAt = driver.UpdatedAt
            };

            return Ok(driverDto);
        }

        // POST: api/Driver
        [HttpPost]
        [RequirePermission(Permission.DriverCreate)]
        public async Task<ActionResult<DriverDto>> CreateDriver(CreateDriverDto createDriverDto)
        {
            // Validate input
            var validationErrors = ValidationService.ValidateDriver(createDriverDto);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Check if driver name already exists
            var existingDriver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Name == createDriverDto.Name.Trim() && d.IsActive);

            if (existingDriver != null)
            {
                return Conflict(new { message = "此司機姓名已存在" });
            }

            var driver = new Driver
            {
                Name = createDriverDto.Name.Trim(),
                Phone = createDriverDto.Phone?.Trim()
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            var driverDto = new DriverDto
            {
                Id = driver.Id,
                Name = driver.Name,
                Phone = driver.Phone,
                IsActive = driver.IsActive,
                CreatedAt = driver.CreatedAt,
                UpdatedAt = driver.UpdatedAt
            };

            return CreatedAtAction(nameof(GetDriver), new { id = driver.Id }, driverDto);
        }

        // PUT: api/Driver/5
        [HttpPut("{id}")]
        [RequirePermission(Permission.DriverUpdate)]
        public async Task<IActionResult> UpdateDriver(string id, UpdateDriverDto updateDriverDto)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null || !driver.IsActive)
            {
                return NotFound();
            }

            // Validate input
            var validationErrors = ValidationService.ValidateDriver(updateDriverDto);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Check if driver name already exists (excluding current driver)
            var existingDriver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Name == updateDriverDto.Name.Trim() && d.Id != id && d.IsActive);

            if (existingDriver != null)
            {
                return Conflict(new { message = "此司機姓名已存在" });
            }

            driver.Name = updateDriverDto.Name.Trim();
            driver.Phone = updateDriverDto.Phone?.Trim();
            driver.IsActive = updateDriverDto.IsActive;
            driver.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Driver/5
        [HttpDelete("{id}")]
        [RequirePermission(Permission.DriverDelete)]
        public async Task<IActionResult> DeleteDriver(string id)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null || !driver.IsActive)
            {
                return NotFound();
            }

            // Check if driver is used in any waybills
            var hasWaybills = await _context.Waybills
                .AnyAsync(w => w.DriverId == id);

            if (hasWaybills)
            {
                return BadRequest(new { message = "無法刪除已被託運單使用的司機，請改為設定為非活躍狀態" });
            }

            // Soft delete - set IsActive to false
            driver.IsActive = false;
            driver.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}