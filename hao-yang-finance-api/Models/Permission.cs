using System.ComponentModel;

namespace hao_yang_finance_api.Models
{
    public enum Permission
    {
        // Waybill permissions
        [Description("查看託運單")] WaybillRead,
        [Description("新增託運單")] WaybillCreate,
        [Description("編輯託運單")] WaybillUpdate,
        [Description("刪除託運單")] WaybillDelete,

        // Invoice permissions
        [Description("查看發票")] InvoiceRead,
        [Description("新增發票")] InvoiceCreate,
        [Description("編輯發票")] InvoiceUpdate,
        [Description("刪除發票")] InvoiceDelete,
        [Description("作廢發票")] InvoiceVoid,
        [Description("標記發票已付款")] InvoiceMarkPaid,

        // Company permissions
        [Description("查看公司")] CompanyRead,
        [Description("新增公司")] CompanyCreate,
        [Description("編輯公司")] CompanyUpdate,
        [Description("刪除公司")] CompanyDelete,

        // Driver permissions
        [Description("查看司機")] DriverRead,
        [Description("新增司機")] DriverCreate,
        [Description("編輯司機")] DriverUpdate,
        [Description("刪除司機")] DriverDelete,

        // Statistics permissions
        [Description("查看統計報表")] StatisticsRead,
        [Description("匯出統計資料")] StatisticsExport,

        // User management permissions (Admin only)
        [Description("查看使用者")] UserRead,
        [Description("新增使用者")] UserCreate,
        [Description("編輯使用者")] UserUpdate,
        [Description("刪除使用者")] UserDelete,
        [Description("變更使用者角色")] UserChangeRole,
        [Description("啟用/停用使用者")] UserChangeStatus
    }

    public static class RolePermissions
    {
        public static readonly Dictionary<string, Permission[]> RolePermissionMap = new()
        {
            ["Admin"] = new[]
            {
                // All permissions
                Permission.WaybillRead, Permission.WaybillCreate, Permission.WaybillUpdate, Permission.WaybillDelete,
                Permission.InvoiceRead, Permission.InvoiceCreate, Permission.InvoiceUpdate, Permission.InvoiceDelete,
                Permission.InvoiceVoid, Permission.InvoiceMarkPaid,
                Permission.CompanyRead, Permission.CompanyCreate, Permission.CompanyUpdate, Permission.CompanyDelete,
                Permission.DriverRead, Permission.DriverCreate, Permission.DriverUpdate, Permission.DriverDelete,
                Permission.StatisticsRead, Permission.StatisticsExport,
                Permission.UserRead, Permission.UserCreate, Permission.UserUpdate, Permission.UserDelete,
                Permission.UserChangeRole, Permission.UserChangeStatus
            },
            ["Accountant"] = new[]
            {
                Permission.WaybillRead,
                Permission.InvoiceRead, Permission.InvoiceCreate, Permission.InvoiceUpdate, Permission.InvoiceDelete,
                Permission.InvoiceVoid, Permission.InvoiceMarkPaid,
                Permission.CompanyRead,
                Permission.DriverRead,
                Permission.StatisticsRead, Permission.StatisticsExport,
            },
            ["Driver"] = new[]
            {
                Permission.CompanyRead,
                Permission.DriverRead,
                Permission.WaybillRead,
            },
        };

        public static Permission[] GetPermissions(string role)
        {
            return RolePermissionMap.TryGetValue(role, out var permissions) ? permissions : Array.Empty<Permission>();
        }

        public static bool HasPermission(string role, Permission permission)
        {
            var permissions = GetPermissions(role);
            return permissions.Contains(permission);
        }
    }
}