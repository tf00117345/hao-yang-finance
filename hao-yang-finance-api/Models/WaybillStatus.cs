using System.ComponentModel;
using System.Text.Json.Serialization;

namespace hao_yang_finance_api.Models
{
    /// <summary>
    /// 託運單狀態枚舉
    /// Waybill Status Enum - Represents the lifecycle states of a waybill
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum WaybillStatus
    {
        /// <summary>
        /// 待處理 - Initial state, awaiting action (invoice, collection request, or mark as no invoice needed)
        /// </summary>
        [Description("PENDING")]
        PENDING,

        /// <summary>
        /// 已開發票 - Invoice has been issued for this waybill
        /// </summary>
        [Description("INVOICED")]
        INVOICED,

        /// <summary>
        /// 不需開發票 - No invoice required for this waybill
        /// </summary>
        [Description("NO_INVOICE_NEEDED")]
        NO_INVOICE_NEEDED,

        /// <summary>
        /// 不需開發票但需請款收稅，未收款
        /// No invoice required but needs to collect with tax, payment not received
        /// 注意：此狀態名稱可能造成混淆，實際業務意義為「已請款但未收到款項」
        /// Note: The naming may be confusing - it actually means "collection requested but payment not received"
        /// Status flow: PENDING → CreateCollectionRequest → NEED_TAX_UNPAID
        /// </summary>
        [Description("NEED_TAX_UNPAID")]
        NEED_TAX_UNPAID,

        /// <summary>
        /// 不需開發票但需請款收稅，已收款
        /// No invoice required but needs to collect with tax, payment received
        /// 注意：此狀態名稱可能造成混淆，實際業務意義為「已請款且已收到款項」
        /// Note: The naming may be confusing - it actually means "collection requested and payment received"
        /// Status flow: NEED_TAX_UNPAID → MarkCollectionPaid → NEED_TAX_PAID
        /// </summary>
        [Description("NEED_TAX_PAID")]
        NEED_TAX_PAID
    }
}
