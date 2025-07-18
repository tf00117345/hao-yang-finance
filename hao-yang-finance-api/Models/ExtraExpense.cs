using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("extra_expense")]
    public class ExtraExpense
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("waybill_id")]
        [Required]
        public string WaybillId { get; set; } = string.Empty;

        [Column("description")]
        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [Column("amount")]
        [Required]
        public decimal Amount { get; set; }

        // New columns for updated schema
        [Column("item")]
        [MaxLength(200)]
        public string? Item { get; set; }

        [Column("fee")]
        public decimal? Fee { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Waybill Waybill { get; set; } = null!;
    }
}