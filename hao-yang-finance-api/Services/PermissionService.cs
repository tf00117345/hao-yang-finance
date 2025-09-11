using System.Security.Claims;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Services
{
    public interface IPermissionService
    {
        bool HasPermission(ClaimsPrincipal user, Permission permission);
        bool HasPermission(string role, Permission permission);
        Permission[] GetUserPermissions(ClaimsPrincipal user);
        Permission[] GetRolePermissions(string role);
        bool IsAdmin(ClaimsPrincipal user);
        bool IsAccountant(ClaimsPrincipal user);
        bool IsDriver(ClaimsPrincipal user);
        string GetUserRole(ClaimsPrincipal user);
    }

    public class PermissionService : IPermissionService
    {
        private readonly ILogger<PermissionService> _logger;

        public PermissionService(ILogger<PermissionService> logger)
        {
            _logger = logger;
        }

        public bool HasPermission(ClaimsPrincipal user, Permission permission)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            var role = GetUserRole(user);
            if (string.IsNullOrEmpty(role))
            {
                _logger.LogWarning("User {UserId} has no role assigned", user.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return false;
            }

            return HasPermission(role, permission);
        }

        public bool HasPermission(string role, Permission permission)
        {
            if (string.IsNullOrEmpty(role))
            {
                return false;
            }

            return RolePermissions.HasPermission(role, permission);
        }

        public Permission[] GetUserPermissions(ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return Array.Empty<Permission>();
            }

            var role = GetUserRole(user);
            return GetRolePermissions(role);
        }

        public Permission[] GetRolePermissions(string role)
        {
            if (string.IsNullOrEmpty(role))
            {
                return Array.Empty<Permission>();
            }

            return RolePermissions.GetPermissions(role);
        }

        public bool IsAdmin(ClaimsPrincipal user)
        {
            return GetUserRole(user) == "Admin";
        }
        
        public bool IsAccountant(ClaimsPrincipal user)
        {
            return GetUserRole(user) == "Accountant";
        }
        
        public bool IsDriver(ClaimsPrincipal user)
        {
            return GetUserRole(user) == "Driver";
        }

        public string GetUserRole(ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return string.Empty;
            }

            return user.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }
    }
}