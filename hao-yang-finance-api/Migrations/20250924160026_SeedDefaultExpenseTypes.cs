using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultExpenseTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert default company expense types
            migrationBuilder.InsertData(
                table: "ExpenseTypes",
                columns: new[] { "Category", "Name", "IsDefault", "DefaultAmount", "Formula", "CreatedAt" },
                values: new object[,]
                {
                    { "company", "稅金", true, null, "income * 0.05", DateTime.UtcNow },
                    { "company", "記帳費", true, 5000m, null, DateTime.UtcNow },
                    { "company", "回郵信封", true, 1000m, null, DateTime.UtcNow },
                    { "company", "靠行費", true, 1500m, null, DateTime.UtcNow },
                    { "company", "補助電話入關", true, 1500m, null, DateTime.UtcNow },
                    { "company", "停車費", true, null, null, DateTime.UtcNow },
                    { "company", "加油", true, null, null, DateTime.UtcNow },
                    { "company", "薪資", true, null, null, DateTime.UtcNow }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove default expense types
            migrationBuilder.Sql("DELETE FROM \"ExpenseTypes\" WHERE \"IsDefault\" = true");
        }
    }
}
