using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace hao_yang_finance_api.Models
{
    [Table("invoice_audit_log")]
    public class InvoiceAuditLog
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("action")]
        [Required]
        [MaxLength(20)]
        public string Action { get; set; } = string.Empty; // CREATE/UPDATE/DELETE/VOID/MARK_PAID/RESTORE

        // 不設 FK/navigation：發票被物理刪除後，稽核紀錄仍須保留
        [Column("invoice_id")]
        [Required]
        public string InvoiceId { get; set; } = string.Empty;

        [Column("invoice_number")]
        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        // 系統當時建議的號碼（僅 CREATE 有值），與 InvoiceNumber 不同即代表使用者手動改號
        [Column("suggested_invoice_number")]
        [MaxLength(50)]
        public string? SuggestedInvoiceNumber { get; set; }

        [Column("user_id")]
        [MaxLength(50)]
        public string? UserId { get; set; }

        [Column("username")]
        [MaxLength(100)]
        public string? Username { get; set; }

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Column("details", TypeName = "jsonb")]
        public string? Details { get; set; }
    }
}
