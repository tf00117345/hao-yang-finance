using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("loading_location")]
    public class LoadingLocation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("waybill_id")]
        [Required]
        public string WaybillId { get; set; } = string.Empty;

        [Column("from_location")]
        [Required]
        [MaxLength(100)]
        public string FromLocation { get; set; } = string.Empty;

        [Column("to_location")]
        [Required]
        [MaxLength(100)]
        public string ToLocation { get; set; } = string.Empty;

        [Column("sequence_order")]
        [Required]
        public int SequenceOrder { get; set; } = 1;

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Waybill Waybill { get; set; } = null!;
    }
}