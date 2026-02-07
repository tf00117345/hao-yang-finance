using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("driver_settlement")]
    public class DriverSettlement
    {
        [Key]
        public long SettlementId { get; set; }

        [Required]
        public string DriverId { get; set; } = string.Empty;

        [ForeignKey("DriverId")]
        public virtual Driver Driver { get; set; } = null!;

        [Required]
        [StringLength(10)]
        public string TargetMonth { get; set; } = string.Empty; // yyyy-MM-01

        [Column(TypeName = "decimal(12,2)")]
        public decimal Income { get; set; } = 0; // 發票收入

        [Column(TypeName = "decimal(12,2)")]
        public decimal IncomeCash { get; set; } = 0; // 現金收入

        [Column(TypeName = "decimal(12,2)")]
        public decimal FeeSplitAmount { get; set; } = 0; // 分攤金額

        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalCompanyExpense { get; set; } = 0;

        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalPersonalExpense { get; set; } = 0;

        [Column(TypeName = "decimal(5,2)")]
        public decimal ProfitShareRatio { get; set; } // e.g., 30 = 30%

        [Column(TypeName = "decimal(12,2)")]
        public decimal Bonus { get; set; } = 0; // 分紅獎金

        [Column(TypeName = "decimal(12,2)")]
        public decimal FinalAmount { get; set; } = 0; // 最終可領金額

        [StringLength(10)]
        public string CalculationVersion { get; set; } = "1.0";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    }
}