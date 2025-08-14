using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hao_yang_finance_api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreatePostgreSQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tax_id = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    contact_person = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "driver",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<string>(type: "text", nullable: false),
                    LastLoginAt = table.Column<string>(type: "text", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiryTime = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "company_phone",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "text", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_phone", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_phone_company_company_id",
                        column: x => x.company_id,
                        principalTable: "company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoice",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    date = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "text", nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric", nullable: false),
                    tax_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    extra_expenses_include_tax = table.Column<bool>(type: "boolean", nullable: false),
                    tax = table.Column<decimal>(type: "numeric", nullable: false),
                    total = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    payment_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    payment_note = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<string>(type: "text", nullable: false),
                    paid_at = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_company_company_id",
                        column: x => x.company_id,
                        principalTable: "company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "waybill",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    waybill_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    date = table.Column<string>(type: "text", nullable: false),
                    item = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    company_id = table.Column<string>(type: "text", nullable: false),
                    working_time_start = table.Column<string>(type: "text", nullable: false),
                    working_time_end = table.Column<string>(type: "text", nullable: false),
                    tonnage = table.Column<decimal>(type: "numeric", nullable: false),
                    fee = table.Column<decimal>(type: "numeric", nullable: false),
                    driver_id = table.Column<string>(type: "text", nullable: false),
                    plate_number = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    invoice_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_waybill", x => x.id);
                    table.ForeignKey(
                        name: "FK_waybill_company_company_id",
                        column: x => x.company_id,
                        principalTable: "company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_waybill_driver_driver_id",
                        column: x => x.driver_id,
                        principalTable: "driver",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_waybill_invoice_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoice",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "extra_expense",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    waybill_id = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    item = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    fee = table.Column<decimal>(type: "numeric", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_extra_expense", x => x.id);
                    table.ForeignKey(
                        name: "FK_extra_expense_waybill_waybill_id",
                        column: x => x.waybill_id,
                        principalTable: "waybill",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoice_waybill",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    invoice_id = table.Column<string>(type: "text", nullable: false),
                    waybill_id = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_waybill", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_waybill_invoice_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoice",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invoice_waybill_waybill_waybill_id",
                        column: x => x.waybill_id,
                        principalTable: "waybill",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "loading_location",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    waybill_id = table.Column<string>(type: "text", nullable: false),
                    from_location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    to_location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sequence_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loading_location", x => x.id);
                    table.ForeignKey(
                        name: "FK_loading_location_waybill_waybill_id",
                        column: x => x.waybill_id,
                        principalTable: "waybill",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoice_extra_expense",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    invoice_id = table.Column<string>(type: "text", nullable: false),
                    extra_expense_id = table.Column<string>(type: "text", nullable: false),
                    is_selected = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_extra_expense", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_extra_expense_extra_expense_extra_expense_id",
                        column: x => x.extra_expense_id,
                        principalTable: "extra_expense",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invoice_extra_expense_invoice_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoice",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_phone_company_id",
                table: "company_phone",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_extra_expense_waybill_id",
                table: "extra_expense",
                column: "waybill_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_company_id",
                table: "invoice",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_extra_expense_extra_expense_id",
                table: "invoice_extra_expense",
                column: "extra_expense_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_extra_expense_invoice_id",
                table: "invoice_extra_expense",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_waybill_invoice_id",
                table: "invoice_waybill",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_waybill_waybill_id",
                table: "invoice_waybill",
                column: "waybill_id");

            migrationBuilder.CreateIndex(
                name: "IX_loading_location_waybill_id",
                table: "loading_location",
                column: "waybill_id");

            migrationBuilder.CreateIndex(
                name: "IX_waybill_company_id",
                table: "waybill",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_waybill_driver_id",
                table: "waybill",
                column: "driver_id");

            migrationBuilder.CreateIndex(
                name: "IX_waybill_invoice_id",
                table: "waybill",
                column: "invoice_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_phone");

            migrationBuilder.DropTable(
                name: "invoice_extra_expense");

            migrationBuilder.DropTable(
                name: "invoice_waybill");

            migrationBuilder.DropTable(
                name: "loading_location");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "extra_expense");

            migrationBuilder.DropTable(
                name: "waybill");

            migrationBuilder.DropTable(
                name: "driver");

            migrationBuilder.DropTable(
                name: "invoice");

            migrationBuilder.DropTable(
                name: "company");
        }
    }
}
