using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("outstanding_balance")]
    public class OutstandingBalance
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("invoice_id")]
        [Required]
        public string InvoiceId { get; set; } = string.Empty;

        [Column("company_id")]
        [Required]
        public string CompanyId { get; set; } = string.Empty;

        [Column("amount")]
        [Required]
        public decimal Amount { get; set; }

        [Column("note")]
        public string? Note { get; set; }

        [Column("status")]
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "outstanding";

        [Column("resolved_at")]
        public string? ResolvedAt { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("updated_at")]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual Company Company { get; set; } = null!;
    }
}
