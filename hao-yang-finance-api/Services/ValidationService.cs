using System.Text.RegularExpressions;
using hao_yang_finance_api.DTOs;

namespace hao_yang_finance_api.Services
{
    public class ValidationService
    {
        public static List<string> ValidateCompany(CreateCompanyDto company)
        {
            var errors = new List<string>();

            // Name validation
            if (string.IsNullOrWhiteSpace(company.Name))
            {
                errors.Add("Company name is required.");
            }
            else if (company.Name.Length > 100)
            {
                errors.Add("Company name cannot exceed 100 characters.");
            }
            
            // Contact Person validation
            if (!string.IsNullOrWhiteSpace(company.ContactPerson) && company.ContactPerson.Length > 50)
            {
                errors.Add("Contact person name cannot exceed 50 characters.");
            }
            
            return errors;
        }

        public static List<string> ValidateCompany(UpdateCompanyDto company)
        {
            var errors = new List<string>();

            // Name validation
            if (string.IsNullOrWhiteSpace(company.Name))
            {
                errors.Add("Company name is required.");
            }
            else if (company.Name.Length > 100)
            {
                errors.Add("Company name cannot exceed 100 characters.");
            }

            // Tax ID validation
            if (!string.IsNullOrWhiteSpace(company.TaxId))
            {
                if (company.TaxId.Length > 20)
                {
                    errors.Add("Tax ID cannot exceed 20 characters.");
                }
                
                // Taiwan tax ID format validation (8 digits)
                if (!Regex.IsMatch(company.TaxId, @"^\d{8}$"))
                {
                    errors.Add("Tax ID must be 8 digits.");
                }
            }

            // Contact Person validation
            if (!string.IsNullOrWhiteSpace(company.ContactPerson) && company.ContactPerson.Length > 50)
            {
                errors.Add("Contact person name cannot exceed 50 characters.");
            }

            // Phone validation
            if (company.Phone != null && company.Phone.Any())
            {
                foreach (var phone in company.Phone)
                {
                    if (!string.IsNullOrWhiteSpace(phone))
                    {
                        if (phone.Length > 50)
                        {
                            errors.Add($"Phone number '{phone}' cannot exceed 50 characters.");
                        }
                        
                        // Basic phone number format validation - allow Chinese characters, numbers, and common symbols
                        if (!Regex.IsMatch(phone, @"^[\d\-\+\(\)\s\u4e00-\u9fff]+$"))
                        {
                            errors.Add($"Phone number '{phone}' contains invalid characters.");
                        }
                    }
                }
            }

            // Email validation
            if (!string.IsNullOrWhiteSpace(company.Email))
            {
                if (company.Email.Length > 100)
                {
                    errors.Add("Email cannot exceed 100 characters.");
                }
                
                // Email format validation
                if (!Regex.IsMatch(company.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    errors.Add("Email format is invalid.");
                }
            }

            return errors;
        }

        public static List<string> ValidateDriver(CreateDriverDto driver)
        {
            var errors = new List<string>();

            // Name validation
            if (string.IsNullOrWhiteSpace(driver.Name))
            {
                errors.Add("Driver name is required.");
            }
            else if (driver.Name.Length > 50)
            {
                errors.Add("Driver name cannot exceed 50 characters.");
            }

            // Phone validation
            if (!string.IsNullOrWhiteSpace(driver.Phone))
            {
                if (driver.Phone.Length > 20)
                {
                    errors.Add("Phone number cannot exceed 20 characters.");
                }
                
                // Basic phone number format validation
                if (!Regex.IsMatch(driver.Phone, @"^[\d\-\+\(\)\s]+$"))
                {
                    errors.Add("Phone number contains invalid characters.");
                }
            }

            return errors;
        }

        public static List<string> ValidateDriver(UpdateDriverDto driver)
        {
            var errors = new List<string>();

            // Name validation
            if (string.IsNullOrWhiteSpace(driver.Name))
            {
                errors.Add("Driver name is required.");
            }
            else if (driver.Name.Length > 50)
            {
                errors.Add("Driver name cannot exceed 50 characters.");
            }

            // Phone validation
            if (!string.IsNullOrWhiteSpace(driver.Phone))
            {
                if (driver.Phone.Length > 20)
                {
                    errors.Add("Phone number cannot exceed 20 characters.");
                }
                
                // Basic phone number format validation
                if (!Regex.IsMatch(driver.Phone, @"^[\d\-\+\(\)\s]+$"))
                {
                    errors.Add("Phone number contains invalid characters.");
                }
            }

            return errors;
        }
    }
}