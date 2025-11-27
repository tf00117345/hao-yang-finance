using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("collection_request")]
    public class CollectionRequest
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("request_number")]
        [Required]
        [MaxLength(50)]
        public string RequestNumber { get; set; } = string.Empty;

        [Column("request_date")]
        [Required]
        public string RequestDate { get; set; } = string.Empty;

        [Column("company_id")]
        [Required]
        public string CompanyId { get; set; } = string.Empty;

        [Column("total_amount")]
        [Required]
        public decimal TotalAmount { get; set; }

        [Column("subtotal")]
        [Required]
        public decimal Subtotal { get; set; }

        [Column("tax_amount")]
        [Required]
        public decimal TaxAmount { get; set; }

        [Column("tax_rate")]
        [Required]
        public decimal TaxRate { get; set; } = 0.05m;

        [Column("status")]
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "requested";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("payment_received_at")]
        public string? PaymentReceivedAt { get; set; }

        [Column("payment_method")]
        [MaxLength(20)]
        public string? PaymentMethod { get; set; }

        [Column("payment_notes")]
        public string? PaymentNotes { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("updated_at")]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Company Company { get; set; } = null!;
        public virtual ICollection<Waybill> Waybills { get; set; } = new List<Waybill>();
    }

    public static class CollectionRequestStatus
    {
        public const string Requested = "requested";
        public const string Paid = "paid";
        public const string Cancelled = "cancelled";
    }
}