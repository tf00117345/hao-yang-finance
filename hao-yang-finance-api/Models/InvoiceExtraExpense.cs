using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("invoice_extra_expense")]
    public class InvoiceExtraExpense
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("invoice_id")]
        [Required]
        public string InvoiceId { get; set; } = string.Empty;

        [Column("extra_expense_id")]
        [Required]
        public string ExtraExpenseId { get; set; } = string.Empty;

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual ExtraExpense ExtraExpense { get; set; } = null!;
    }
}