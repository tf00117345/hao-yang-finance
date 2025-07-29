using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSelectedToInvoiceExtraExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_selected",
                table: "invoice_extra_expense",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_selected",
                table: "invoice_extra_expense");
        }
    }
}
