using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Services;

namespace hao_yang_finance_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompanyController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Company
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies()
        {
            var companies = await _context.Companies
                .Include(c => c.Phones)
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new CompanyDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    TaxId = c.TaxId,
                    ContactPerson = c.ContactPerson,
                    Phone = c.Phones.Select(p => p.PhoneNumber).ToList(),
                    Address = c.Address,
                    Email = c.Email,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(companies);
        }

        // GET: api/Company/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyDto>> GetCompany(string id)
        {
            var company = await _context.Companies
                .Include(c => c.Phones)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (company == null || !company.IsActive)
            {
                return NotFound();
            }

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                TaxId = company.TaxId,
                ContactPerson = company.ContactPerson,
                Phone = company.Phones.Select(p => p.PhoneNumber).ToList(),
                Address = company.Address,
                Email = company.Email,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };

            return Ok(companyDto);
        }

        // POST: api/Company
        [HttpPost]
        public async Task<ActionResult<CompanyDto>> CreateCompany(CreateCompanyDto createCompanyDto)
        {
            // Validate input
            var validationErrors = ValidationService.ValidateCompany(createCompanyDto);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Check if company name already exists
            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.Name == createCompanyDto.Name.Trim() && c.IsActive);

            if (existingCompany != null)
            {
                return Conflict("Company with this name already exists.");
            }

            var company = new Company
            {
                Name = createCompanyDto.Name.Trim(),
                TaxId = createCompanyDto.TaxId?.Trim(),
                ContactPerson = createCompanyDto.ContactPerson?.Trim(),
                Address = createCompanyDto.Address?.Trim(),
                Email = createCompanyDto.Email?.Trim()
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Add phone numbers
            foreach (var phoneNumber in createCompanyDto.Phone)
            {
                if (!string.IsNullOrWhiteSpace(phoneNumber))
                {
                    var companyPhone = new CompanyPhone
                    {
                        CompanyId = company.Id,
                        PhoneNumber = phoneNumber.Trim()
                    };
                    _context.CompanyPhones.Add(companyPhone);
                }
            }
            await _context.SaveChangesAsync();

            // Reload company with phones for response
            var companyWithPhones = await _context.Companies
                .Include(c => c.Phones)
                .FirstOrDefaultAsync(c => c.Id == company.Id);

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                TaxId = company.TaxId,
                ContactPerson = company.ContactPerson,
                Phone = companyWithPhones!.Phones.Select(p => p.PhoneNumber).ToList(),
                Address = company.Address,
                Email = company.Email,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };

            return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, companyDto);
        }

        // PUT: api/Company/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(string id, UpdateCompanyDto updateCompanyDto)
        {
            var company = await _context.Companies
                .Include(c => c.Phones)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (company == null || !company.IsActive)
            {
                return NotFound();
            }

            // Validate input
            var validationErrors = ValidationService.ValidateCompany(updateCompanyDto);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Check if company name already exists (excluding current company)
            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.Name == updateCompanyDto.Name.Trim() && c.Id != id && c.IsActive);

            if (existingCompany != null)
            {
                return Conflict("Company with this name already exists.");
            }

            company.Name = updateCompanyDto.Name.Trim();
            company.TaxId = updateCompanyDto.TaxId?.Trim();
            company.ContactPerson = updateCompanyDto.ContactPerson?.Trim();
            company.Address = updateCompanyDto.Address?.Trim();
            company.Email = updateCompanyDto.Email?.Trim();
            company.IsActive = updateCompanyDto.IsActive;
            company.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            // Update phone numbers
            // Remove existing phone numbers
            _context.CompanyPhones.RemoveRange(company.Phones);
            
            // Add new phone numbers
            foreach (var phoneNumber in updateCompanyDto.Phone)
            {
                if (!string.IsNullOrWhiteSpace(phoneNumber))
                {
                    var companyPhone = new CompanyPhone
                    {
                        CompanyId = company.Id,
                        PhoneNumber = phoneNumber.Trim()
                    };
                    _context.CompanyPhones.Add(companyPhone);
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Company/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(string id)
        {
            var company = await _context.Companies.FindAsync(id);

            if (company == null || !company.IsActive)
            {
                return NotFound();
            }

            // Check if company is used in any active waybills
            var hasActiveWaybills = await _context.Waybills
                .AnyAsync(w => w.CompanyId == id);

            if (hasActiveWaybills)
            {
                return BadRequest("Cannot delete company that is used in waybills. Please set it as inactive instead.");
            }

            // Soft delete - set IsActive to false
            company.IsActive = false;
            company.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}