using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("waybill")]
    public class Waybill
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("waybill_number")]
        [MaxLength(50)]
        public string? WaybillNumber { get; set; }

        [Column("date")]
        [Required]
        public string Date { get; set; } = string.Empty;

        [Column("item")]
        [Required]
        [MaxLength(100)]
        public string Item { get; set; } = string.Empty;

        [Column("company_id")]
        [Required]
        public string CompanyId { get; set; } = string.Empty;

        [Column("working_time_start")]
        public string? WorkingTimeStart { get; set; }

        [Column("working_time_end")]
        public string? WorkingTimeEnd { get; set; }

        [Column("tonnage")]
        [Required]
        public decimal Tonnage { get; set; }

        [Column("fee")]
        [Required]
        public decimal Fee { get; set; }

        [Column("driver_id")]
        [Required]
        public string DriverId { get; set; } = string.Empty;

        [Column("plate_number")]
        [Required]
        [MaxLength(10)]
        public string PlateNumber { get; set; } = string.Empty;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("status")]
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "PENDING";

        [Column("invoice_id")]
        public string? InvoiceId { get; set; }

        [Column("tax_amount")]
        public decimal? TaxAmount { get; set; }

        [Column("tax_rate")]
        public decimal TaxRate { get; set; } = 0.05m;

        [Column("payment_notes")]
        public string? PaymentNotes { get; set; }

        [Column("payment_received_at")]
        public string? PaymentReceivedAt { get; set; }

        [Column("payment_method")]
        [MaxLength(20)]
        public string? PaymentMethod { get; set; }

        [Column("collection_request_id")]
        public string? CollectionRequestId { get; set; }

        [Column("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [Column("updated_at")]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Navigation properties
        public virtual Company Company { get; set; } = null!;
        public virtual Driver Driver { get; set; } = null!;
        public virtual Invoice? Invoice { get; set; }
        public virtual CollectionRequest? CollectionRequest { get; set; }
        public virtual ICollection<LoadingLocation> LoadingLocations { get; set; } = new List<LoadingLocation>();
        public virtual ICollection<ExtraExpense> ExtraExpenses { get; set; } = new List<ExtraExpense>();
    }
}