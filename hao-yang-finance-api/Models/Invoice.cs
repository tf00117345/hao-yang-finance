using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("invoice")]
    public class Invoice
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("invoice_number")]
        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Column("date")]
        [Required]
        public string Date { get; set; } = string.Empty;

        [Column("company_id")]
        [Required]
        public string CompanyId { get; set; } = string.Empty;

        [Column("subtotal")]
        [Required]
        public decimal Subtotal { get; set; }

        [Column("tax_rate")]
        [Required]
        public decimal TaxRate { get; set; } = 0.05m;

        [Column("extra_expenses_include_tax")]
        [Required]
        public bool ExtraExpensesIncludeTax { get; set; } = false;

        [Column("tax")]
        [Required]
        public decimal Tax { get; set; }

        [Column("total")]
        [Required]
        public decimal Total { get; set; }

        [Column("status")]
        [Required]
        [MaxLength(10)]
        public string Status { get; set; } = "issued";

        [Column("payment_method")]
        [MaxLength(20)]
        public string? PaymentMethod { get; set; }

        [Column("payment_note")]
        public string? PaymentNote { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("updated_at")]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("paid_at")]
        public string? PaidAt { get; set; }

        // Navigation properties
        public virtual Company Company { get; set; } = null!;
        public virtual ICollection<InvoiceWaybill> InvoiceWaybills { get; set; } = new List<InvoiceWaybill>();
        public virtual ICollection<InvoiceExtraExpense> InvoiceExtraExpenses { get; set; } = new List<InvoiceExtraExpense>();
    }
}