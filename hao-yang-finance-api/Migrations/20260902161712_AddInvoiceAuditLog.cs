using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceAuditLog : Migration
    {
        // 注意：EF 產生此 migration 時，model snapshot 落後於資料庫實際狀態
        // （collection_request、outstanding_balance、waybill_fee_split 等表先前以手動 SQL 建立），
        // 因此自動生成的內容混入了那些已存在的表。此處已手動修剪為只建立 invoice_audit_log；
        // snapshot 檔保留完整 model 狀態，讓後續 migration 不再重複這些差異。

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "invoice_audit_log",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    invoice_id = table.Column<string>(type: "text", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    suggested_invoice_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    user_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    details = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_audit_log", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_invoice_audit_log_invoice_id",
                table: "invoice_audit_log",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_audit_log_timestamp",
                table: "invoice_audit_log",
                column: "timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "invoice_audit_log");
        }
    }
}
