using Microsoft.EntityFrameworkCore;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<CompanyPhone> CompanyPhones { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Waybill> Waybills { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<LoadingLocation> LoadingLocations { get; set; }
        public DbSet<ExtraExpense> ExtraExpenses { get; set; }
        public DbSet<InvoiceWaybill> InvoiceWaybills { get; set; }
        public DbSet<InvoiceExtraExpense> InvoiceExtraExpenses { get; set; }
        public DbSet<ExpenseType> ExpenseTypes { get; set; }
        public DbSet<DriverSettlement> DriverSettlements { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<CollectionRequest> CollectionRequests { get; set; }
        public DbSet<WaybillFeeSplit> WaybillFeeSplits { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Company
            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasMany(c => c.Waybills)
                    .WithOne(w => w.Company)
                    .HasForeignKey(w => w.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(c => c.Invoices)
                    .WithOne(i => i.Company)
                    .HasForeignKey(i => i.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(c => c.Phones)
                    .WithOne(p => p.Company)
                    .HasForeignKey(p => p.CompanyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Driver
            modelBuilder.Entity<Driver>(entity =>
            {
                entity.HasMany(d => d.Waybills)
                    .WithOne(w => w.Driver)
                    .HasForeignKey(w => w.DriverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(d => d.Settlements)
                    .WithOne(s => s.Driver)
                    .HasForeignKey(s => s.DriverId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Waybill
            modelBuilder.Entity<Waybill>(entity =>
            {
                entity.HasMany(w => w.LoadingLocations)
                    .WithOne(l => l.Waybill)
                    .HasForeignKey(l => l.WaybillId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.ExtraExpenses)
                    .WithOne(e => e.Waybill)
                    .HasForeignKey(e => e.WaybillId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.FeeSplits)
                    .WithOne(fs => fs.Waybill)
                    .HasForeignKey(fs => fs.WaybillId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(w => w.Invoice)
                    .WithMany()
                    .HasForeignKey(w => w.InvoiceId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure WaybillFeeSplit
            modelBuilder.Entity<WaybillFeeSplit>(entity =>
            {
                entity.HasOne(fs => fs.TargetDriver)
                    .WithMany()
                    .HasForeignKey(fs => fs.TargetDriverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(fs => fs.Amount)
                    .HasPrecision(12, 2);
            });

            // Configure Invoice
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasMany(i => i.InvoiceWaybills)
                    .WithOne(iw => iw.Invoice)
                    .HasForeignKey(iw => iw.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(i => i.InvoiceExtraExpenses)
                    .WithOne(ie => ie.Invoice)
                    .HasForeignKey(ie => ie.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure InvoiceWaybill
            modelBuilder.Entity<InvoiceWaybill>(entity =>
            {
                entity.HasOne(iw => iw.Waybill)
                    .WithMany()
                    .HasForeignKey(iw => iw.WaybillId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure InvoiceExtraExpense
            modelBuilder.Entity<InvoiceExtraExpense>(entity =>
            {
                entity.HasOne(ie => ie.ExtraExpense)
                    .WithMany()
                    .HasForeignKey(ie => ie.ExtraExpenseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure DriverSettlement
            modelBuilder.Entity<DriverSettlement>(entity =>
            {
                entity.HasIndex(ds => new { ds.DriverId, ds.TargetMonth })
                    .IsUnique();

                entity.HasMany(ds => ds.Expenses)
                    .WithOne(e => e.Settlement)
                    .HasForeignKey(e => e.SettlementId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Expense
            modelBuilder.Entity<Expense>(entity =>
            {
                entity.HasOne(e => e.ExpenseType)
                    .WithMany()
                    .HasForeignKey(e => e.ExpenseTypeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(e => e.Amount)
                    .HasPrecision(12, 2);
            });

            // Configure ExpenseType
            modelBuilder.Entity<ExpenseType>(entity =>
            {
                entity.Property(et => et.DefaultAmount)
                    .HasPrecision(12, 2);
            });

            // Configure CollectionRequest
            modelBuilder.Entity<CollectionRequest>(entity =>
            {
                entity.HasMany(cr => cr.Waybills)
                    .WithOne(w => w.CollectionRequest)
                    .HasForeignKey(w => w.CollectionRequestId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(cr => cr.Company)
                    .WithMany()
                    .HasForeignKey(cr => cr.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(cr => cr.TotalAmount)
                    .HasPrecision(12, 2);

                entity.Property(cr => cr.Subtotal)
                    .HasPrecision(12, 2);

                entity.Property(cr => cr.TaxAmount)
                    .HasPrecision(12, 2);

                entity.Property(cr => cr.TaxRate)
                    .HasPrecision(5, 4);
            });
        }
    }
}