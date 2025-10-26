using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("expense_type")]
    public class ExpenseType
    {
        [Key]
        public int ExpenseTypeId { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // "company" or "personal"

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;

        public decimal? DefaultAmount { get; set; }

        public string? Formula { get; set; } // e.g., "income * 0.05"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}