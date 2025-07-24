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

                entity.HasOne(w => w.Invoice)
                    .WithMany()
                    .HasForeignKey(w => w.InvoiceId)
                    .OnDelete(DeleteBehavior.SetNull);
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
        }
    }
}