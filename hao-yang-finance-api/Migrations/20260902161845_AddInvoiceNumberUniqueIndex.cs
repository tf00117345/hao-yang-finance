using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceNumberUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_invoice_invoice_number",
                table: "invoice",
                column: "invoice_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_invoice_invoice_number",
                table: "invoice");
        }
    }
}
