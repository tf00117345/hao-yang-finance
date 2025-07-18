namespace hao_yang_finance_api.DTOs
{
    public class CompanyDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? TaxId { get; set; }
        public string? ContactPerson { get; set; }
        public List<string> Phone { get; set; } = new List<string>();
        public string? Address { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreateCompanyDto
    {
        public string Name { get; set; } = string.Empty;
        public string? TaxId { get; set; }
        public string? ContactPerson { get; set; }
        public List<string> Phone { get; set; } = new List<string>();
        public string? Address { get; set; }
        public string? Email { get; set; }
    }

    public class UpdateCompanyDto
    {
        public string Name { get; set; } = string.Empty;
        public string? TaxId { get; set; }
        public string? ContactPerson { get; set; }
        public List<string> Phone { get; set; } = new List<string>();
        public string? Address { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; }
    }
}