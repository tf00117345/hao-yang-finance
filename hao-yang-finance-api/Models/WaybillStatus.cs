using System.ComponentModel;
using System.Text.Json.Serialization;

namespace hao_yang_finance_api.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum WaybillStatus
    {
        [Description("PENDING")]
        PENDING,

        [Description("INVOICED")]
        INVOICED,

        [Description("NO_INVOICE_NEEDED")]
        NO_INVOICE_NEEDED,

        [Description("PENDING_PAYMENT")]
        PENDING_PAYMENT
    }
}
