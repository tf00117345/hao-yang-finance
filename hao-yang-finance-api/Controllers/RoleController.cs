using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel;
using System.Security.Claims;
using hao_yang_finance_api.Services;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly ILogger<RoleController> _logger;

        public RoleController(
            IPermissionService permissionService,
            ILogger<RoleController> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// 獲取所有權限列表
        /// </summary>
        [HttpGet("permissions")]
        public ActionResult<List<PermissionDto>> GetAllPermissions()
        {
            try
            {
                var permissions = Enum.GetValues<Permission>()
                    .Select(p => new PermissionDto
                    {
                        Name = p.ToString(),
                        DisplayName = GetPermissionDisplayName(p),
                        Category = GetPermissionCategory(p)
                    })
                    .ToList();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all permissions");
                return StatusCode(500, new { message = "獲取權限列表時發生錯誤" });
            }
        }

        /// <summary>
        /// 獲取指定角色的權限
        /// </summary>
        [HttpGet("permissions/{role}")]
        public ActionResult<RolePermissionsDto> GetRolePermissions(string role)
        {
            try
            {
                var permissions = _permissionService.GetRolePermissions(role)
                    .Select(p => new PermissionDto
                    {
                        Name = p.ToString(),
                        DisplayName = GetPermissionDisplayName(p),
                        Category = GetPermissionCategory(p)
                    })
                    .ToList();

                var result = new RolePermissionsDto
                {
                    RoleName = role,
                    DisplayName = GetRoleDisplayName(role),
                    Permissions = permissions
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role permissions for role: {Role}", role);
                return StatusCode(500, new { message = "獲取角色權限時發生錯誤" });
            }
        }

        /// <summary>
        /// 獲取所有角色及其權限
        /// </summary>
        [HttpGet("all")]
        public ActionResult<AllRolesPermissionsDto> GetAllRolesPermissions()
        {
            try
            {
                var allPermissions = Enum.GetValues<Permission>()
                    .Select(p => new PermissionDto
                    {
                        Name = p.ToString(),
                        DisplayName = GetPermissionDisplayName(p),
                        Category = GetPermissionCategory(p)
                    })
                    .ToList();

                var roles = RolePermissions.RolePermissionMap.Keys
                    .Select(role => new RolePermissionsDto
                    {
                        RoleName = role,
                        DisplayName = GetRoleDisplayName(role),
                        Permissions = _permissionService.GetRolePermissions(role)
                            .Select(p => new PermissionDto
                            {
                                Name = p.ToString(),
                                DisplayName = GetPermissionDisplayName(p),
                                Category = GetPermissionCategory(p)
                            })
                            .ToList()
                    })
                    .ToList();

                var result = new AllRolesPermissionsDto
                {
                    Roles = roles,
                    AllPermissions = allPermissions
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all roles and permissions");
                return StatusCode(500, new { message = "獲取所有角色和權限時發生錯誤" });
            }
        }

        /// <summary>
        /// 獲取當前使用者的權限
        /// </summary>
        [HttpGet("my-permissions")]
        public ActionResult<UserPermissionsDto> GetMyPermissions()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var role = _permissionService.GetUserRole(User);
                var permissions = _permissionService.GetUserPermissions(User)
                    .Select(p => new PermissionDto
                    {
                        Name = p.ToString(),
                        DisplayName = GetPermissionDisplayName(p),
                        Category = GetPermissionCategory(p)
                    })
                    .ToList();

                var result = new UserPermissionsDto
                {
                    UserId = userId ?? string.Empty,
                    Role = role,
                    Permissions = permissions
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user permissions");
                return StatusCode(500, new { message = "獲取使用者權限時發生錯誤" });
            }
        }

        /// <summary>
        /// 檢查當前使用者是否擁有指定權限
        /// </summary>
        [HttpPost("check-permission")]
        public ActionResult<bool> CheckPermission([FromBody] string permissionName)
        {
            try
            {
                if (!Enum.TryParse<Permission>(permissionName, out var permission))
                {
                    return BadRequest(new { message = "無效的權限名稱" });
                }

                var hasPermission = _permissionService.HasPermission(User, permission);
                return Ok(hasPermission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission: {Permission}", permissionName);
                return StatusCode(500, new { message = "檢查權限時發生錯誤" });
            }
        }

        private static string GetPermissionDisplayName(Permission permission)
        {
            var field = permission.GetType().GetField(permission.ToString());
            var attribute = field?.GetCustomAttributes(typeof(DescriptionAttribute), false)
                .FirstOrDefault() as DescriptionAttribute;
            return attribute?.Description ?? permission.ToString();
        }

        private static string GetPermissionCategory(Permission permission)
        {
            var name = permission.ToString();
            if (name.StartsWith("Waybill")) return "託運單";
            if (name.StartsWith("Invoice")) return "發票";
            if (name.StartsWith("Company")) return "公司";
            if (name.StartsWith("Driver")) return "司機";
            if (name.StartsWith("Statistics")) return "統計";
            if (name.StartsWith("User")) return "使用者管理";
            return "其他";
        }

        private static string GetRoleDisplayName(string role)
        {
            return role switch
            {
                "Admin" => "系統管理員",
                "Accountant" => "會計",
                "Driver" => "司機",
                _ => role
            };
        }
    }
}