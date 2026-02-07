using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("waybill_fee_split")]
    public class WaybillFeeSplit
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("waybill_id")]
        [Required]
        public string WaybillId { get; set; } = string.Empty;

        [Column("target_driver_id")]
        [Required]
        public string TargetDriverId { get; set; } = string.Empty;

        [Column("amount")]
        [Required]
        public decimal Amount { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("updated_at")]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Waybill Waybill { get; set; } = null!;
        public virtual Driver TargetDriver { get; set; } = null!;
    }
}
