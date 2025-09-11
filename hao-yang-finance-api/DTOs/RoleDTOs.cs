using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.DTOs
{
    public class PermissionDto
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class RolePermissionsDto
    {
        public string RoleName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public List<PermissionDto> Permissions { get; set; } = new();
    }

    public class AllRolesPermissionsDto
    {
        public List<RolePermissionsDto> Roles { get; set; } = new();
        public List<PermissionDto> AllPermissions { get; set; } = new();
    }

    public class UserPermissionsDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<PermissionDto> Permissions { get; set; } = new();
    }
}