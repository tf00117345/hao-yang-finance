using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class RenameTablesToCamelCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DriverSettlements_driver_DriverId",
                table: "DriverSettlements");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_DriverSettlements_SettlementId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_ExpenseTypes_ExpenseTypeId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementAuditLogs_DriverSettlements_SettlementId",
                table: "SettlementAuditLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SettlementAuditLogs",
                table: "SettlementAuditLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ExpenseTypes",
                table: "ExpenseTypes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Expenses",
                table: "Expenses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DriverSettlements",
                table: "DriverSettlements");

            migrationBuilder.RenameTable(
                name: "SettlementAuditLogs",
                newName: "settlement_audit_log");

            migrationBuilder.RenameTable(
                name: "ExpenseTypes",
                newName: "expense_type");

            migrationBuilder.RenameTable(
                name: "Expenses",
                newName: "expense");

            migrationBuilder.RenameTable(
                name: "DriverSettlements",
                newName: "driver_settlement");

            migrationBuilder.RenameIndex(
                name: "IX_SettlementAuditLogs_SettlementId",
                table: "settlement_audit_log",
                newName: "IX_settlement_audit_log_SettlementId");

            migrationBuilder.RenameIndex(
                name: "IX_Expenses_SettlementId",
                table: "expense",
                newName: "IX_expense_SettlementId");

            migrationBuilder.RenameIndex(
                name: "IX_Expenses_ExpenseTypeId",
                table: "expense",
                newName: "IX_expense_ExpenseTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_DriverSettlements_DriverId_TargetMonth",
                table: "driver_settlement",
                newName: "IX_driver_settlement_DriverId_TargetMonth");

            migrationBuilder.AddPrimaryKey(
                name: "PK_settlement_audit_log",
                table: "settlement_audit_log",
                column: "LogId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_expense_type",
                table: "expense_type",
                column: "ExpenseTypeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_expense",
                table: "expense",
                column: "ExpenseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_driver_settlement",
                table: "driver_settlement",
                column: "SettlementId");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_settlement_driver_DriverId",
                table: "driver_settlement",
                column: "DriverId",
                principalTable: "driver",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_expense_driver_settlement_SettlementId",
                table: "expense",
                column: "SettlementId",
                principalTable: "driver_settlement",
                principalColumn: "SettlementId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_expense_expense_type_ExpenseTypeId",
                table: "expense",
                column: "ExpenseTypeId",
                principalTable: "expense_type",
                principalColumn: "ExpenseTypeId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_settlement_audit_log_driver_settlement_SettlementId",
                table: "settlement_audit_log",
                column: "SettlementId",
                principalTable: "driver_settlement",
                principalColumn: "SettlementId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_driver_settlement_driver_DriverId",
                table: "driver_settlement");

            migrationBuilder.DropForeignKey(
                name: "FK_expense_driver_settlement_SettlementId",
                table: "expense");

            migrationBuilder.DropForeignKey(
                name: "FK_expense_expense_type_ExpenseTypeId",
                table: "expense");

            migrationBuilder.DropForeignKey(
                name: "FK_settlement_audit_log_driver_settlement_SettlementId",
                table: "settlement_audit_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_settlement_audit_log",
                table: "settlement_audit_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_expense_type",
                table: "expense_type");

            migrationBuilder.DropPrimaryKey(
                name: "PK_expense",
                table: "expense");

            migrationBuilder.DropPrimaryKey(
                name: "PK_driver_settlement",
                table: "driver_settlement");

            migrationBuilder.RenameTable(
                name: "settlement_audit_log",
                newName: "SettlementAuditLogs");

            migrationBuilder.RenameTable(
                name: "expense_type",
                newName: "ExpenseTypes");

            migrationBuilder.RenameTable(
                name: "expense",
                newName: "Expenses");

            migrationBuilder.RenameTable(
                name: "driver_settlement",
                newName: "DriverSettlements");

            migrationBuilder.RenameIndex(
                name: "IX_settlement_audit_log_SettlementId",
                table: "SettlementAuditLogs",
                newName: "IX_SettlementAuditLogs_SettlementId");

            migrationBuilder.RenameIndex(
                name: "IX_expense_SettlementId",
                table: "Expenses",
                newName: "IX_Expenses_SettlementId");

            migrationBuilder.RenameIndex(
                name: "IX_expense_ExpenseTypeId",
                table: "Expenses",
                newName: "IX_Expenses_ExpenseTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_driver_settlement_DriverId_TargetMonth",
                table: "DriverSettlements",
                newName: "IX_DriverSettlements_DriverId_TargetMonth");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SettlementAuditLogs",
                table: "SettlementAuditLogs",
                column: "LogId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExpenseTypes",
                table: "ExpenseTypes",
                column: "ExpenseTypeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Expenses",
                table: "Expenses",
                column: "ExpenseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DriverSettlements",
                table: "DriverSettlements",
                column: "SettlementId");

            migrationBuilder.AddForeignKey(
                name: "FK_DriverSettlements_driver_DriverId",
                table: "DriverSettlements",
                column: "DriverId",
                principalTable: "driver",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_DriverSettlements_SettlementId",
                table: "Expenses",
                column: "SettlementId",
                principalTable: "DriverSettlements",
                principalColumn: "SettlementId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_ExpenseTypes_ExpenseTypeId",
                table: "Expenses",
                column: "ExpenseTypeId",
                principalTable: "ExpenseTypes",
                principalColumn: "ExpenseTypeId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementAuditLogs_DriverSettlements_SettlementId",
                table: "SettlementAuditLogs",
                column: "SettlementId",
                principalTable: "DriverSettlements",
                principalColumn: "SettlementId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
