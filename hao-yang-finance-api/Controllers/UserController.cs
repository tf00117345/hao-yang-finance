using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using hao_yang_finance_api.Services;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Attributes;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserManagementService userManagementService,
            IPermissionService permissionService,
            ILogger<UserController> logger)
        {
            _userManagementService = userManagementService;
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// 獲取使用者列表 (Admin only)
        /// </summary>
        [HttpGet]
        [AdminOnly]
        public async Task<ActionResult<UserListResponseDto>> GetUsers([FromQuery] UserSearchDto searchDto)
        {
            try
            {
                var result = await _userManagementService.GetUsersAsync(searchDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { message = "獲取使用者列表時發生錯誤" });
            }
        }

        /// <summary>
        /// 根據ID獲取使用者詳細資料 (Admin only)
        /// </summary>
        [HttpGet("{id}")]
        [AdminOnly]
        public async Task<ActionResult<UserDetailDto>> GetUser(string id)
        {
            try
            {
                var user = await _userManagementService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "找不到指定的使用者" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, new { message = "獲取使用者資料時發生錯誤" });
            }
        }

        /// <summary>
        /// 建立新使用者 (Admin only)
        /// </summary>
        [HttpPost]
        [AdminOnly]
        public async Task<ActionResult<UserDetailDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userManagementService.CreateUserAsync(createUserDto);
                if (result == null)
                {
                    return Conflict(new { message = "用戶名或電子郵件已存在" });
                }

                var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("User {Username} created by admin {AdminUserId}", createUserDto.Username, adminUserId);

                return CreatedAtAction(nameof(GetUser), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user {Username}", createUserDto.Username);
                return StatusCode(500, new { message = "建立使用者時發生錯誤" });
            }
        }

        /// <summary>
        /// 更新使用者資料 (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        [AdminOnly]
        public async Task<ActionResult<UserDetailDto>> UpdateUser(string id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userManagementService.UpdateUserAsync(id, updateUserDto);
                if (result == null)
                {
                    return NotFound(new { message = "找不到指定的使用者或用戶名/電子郵件已存在" });
                }

                var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("User {UserId} updated by admin {AdminUserId}", id, adminUserId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new { message = "更新使用者時發生錯誤" });
            }
        }

        /// <summary>
        /// 刪除使用者 (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [AdminOnly]
        public async Task<ActionResult> DeleteUser(string id)
        {
            try
            {
                // Prevent admin from deleting themselves
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == id)
                {
                    return BadRequest(new { message = "不能刪除自己的帳號" });
                }

                var result = await _userManagementService.DeleteUserAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "找不到指定的使用者" });
                }

                _logger.LogInformation("User {UserId} deleted by admin {AdminUserId}", id, currentUserId);
                return Ok(new { message = "使用者刪除成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new { message = "刪除使用者時發生錯誤" });
            }
        }

        /// <summary>
        /// 變更使用者角色 (Admin only)
        /// </summary>
        [HttpPut("{id}/role")]
        [AdminOnly]
        public async Task<ActionResult> ChangeUserRole(string id, [FromBody] ChangeUserRoleDto changeRoleDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Prevent admin from changing their own role
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == id)
                {
                    return BadRequest(new { message = "不能修改自己的角色" });
                }

                var result = await _userManagementService.ChangeUserRoleAsync(id, changeRoleDto.Role);
                if (!result)
                {
                    return NotFound(new { message = "找不到指定的使用者" });
                }

                _logger.LogInformation("User {UserId} role changed to {Role} by admin {AdminUserId}", 
                    id, changeRoleDto.Role, currentUserId);

                return Ok(new { message = "角色變更成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing role for user {UserId}", id);
                return StatusCode(500, new { message = "變更角色時發生錯誤" });
            }
        }

        /// <summary>
        /// 變更使用者狀態 (啟用/停用) (Admin only)
        /// </summary>
        [HttpPut("{id}/status")]
        [AdminOnly]
        public async Task<ActionResult> ChangeUserStatus(string id, [FromBody] ChangeUserStatusDto changeStatusDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Prevent admin from disabling themselves
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == id && !changeStatusDto.IsActive)
                {
                    return BadRequest(new { message = "不能停用自己的帳號" });
                }

                var result = await _userManagementService.ChangeUserStatusAsync(id, changeStatusDto.IsActive);
                if (!result)
                {
                    return NotFound(new { message = "找不到指定的使用者" });
                }

                var statusText = changeStatusDto.IsActive ? "啟用" : "停用";
                _logger.LogInformation("User {UserId} {Status} by admin {AdminUserId}", id, statusText, currentUserId);

                return Ok(new { message = $"使用者{statusText}成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing status for user {UserId}", id);
                return StatusCode(500, new { message = "變更狀態時發生錯誤" });
            }
        }

        /// <summary>
        /// 重置使用者密碼 (Admin only)
        /// </summary>
        [HttpPost("{id}/reset-password")]
        [AdminOnly]
        public async Task<ActionResult> ResetUserPassword(string id, [FromBody] ResetUserPasswordDto resetPasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userManagementService.ResetUserPasswordAsync(id, resetPasswordDto.NewPassword);
                if (!result)
                {
                    return NotFound(new { message = "找不到指定的使用者" });
                }

                var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("Password reset for user {UserId} by admin {AdminUserId}", id, adminUserId);

                return Ok(new { message = "密碼重置成功，使用者需要重新登入" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for user {UserId}", id);
                return StatusCode(500, new { message = "重置密碼時發生錯誤" });
            }
        }

        /// <summary>
        /// 獲取當前使用者的權限列表
        /// </summary>
        [HttpGet("my-permissions")]
        public ActionResult<string[]> GetMyPermissions()
        {
            try
            {
                var permissions = _permissionService.GetUserPermissions(User)
                    .Select(p => p.ToString())
                    .ToArray();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user permissions");
                return StatusCode(500, new { message = "獲取權限時發生錯誤" });
            }
        }
    }
}