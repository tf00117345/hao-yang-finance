using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("expense")]
    public class Expense
    {
        [Key]
        public long ExpenseId { get; set; }

        [Required]
        public long SettlementId { get; set; }

        [ForeignKey("SettlementId")]
        public virtual DriverSettlement Settlement { get; set; } = null!;

        public int? ExpenseTypeId { get; set; }

        [ForeignKey("ExpenseTypeId")]
        public virtual ExpenseType? ExpenseType { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // "company" or "personal"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}