using System.ComponentModel.DataAnnotations;

namespace hao_yang_finance_api.DTOs
{
    // 欠款查詢回應 DTO
    public class OutstandingBalanceDto
    {
        public string Id { get; set; } = string.Empty;
        public string InvoiceId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ResolvedAt { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }

    // 按公司分組的欠款摘要 DTO
    public class CompanyOutstandingBalanceSummaryDto
    {
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public decimal TotalOutstanding { get; set; }
        public List<OutstandingBalanceDto> Records { get; set; } = new List<OutstandingBalanceDto>();
    }
}
