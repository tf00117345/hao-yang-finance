using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;
using System.ComponentModel;
using System.Reflection;

namespace hao_yang_finance_api.Services
{
    public interface IUserManagementService
    {
        Task<UserListResponseDto> GetUsersAsync(UserSearchDto searchDto);
        Task<UserDetailDto?> GetUserByIdAsync(string userId);
        Task<UserDetailDto?> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDetailDto?> UpdateUserAsync(string userId, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(string userId);
        Task<bool> ChangeUserRoleAsync(string userId, string role);
        Task<bool> ChangeUserStatusAsync(string userId, bool isActive);
        Task<bool> ResetUserPasswordAsync(string userId, string newPassword);
        Task<bool> UserExistsAsync(string username, string email, string? excludeUserId = null);
    }

    public class UserManagementService : IUserManagementService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<UserManagementService> _logger;

        public UserManagementService(
            ApplicationDbContext context,
            IPermissionService permissionService,
            ILogger<UserManagementService> logger)
        {
            _context = context;
            _permissionService = permissionService;
            _logger = logger;
        }

        public async Task<UserListResponseDto> GetUsersAsync(UserSearchDto searchDto)
        {
            var query = _context.Users.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchDto.Username))
            {
                query = query.Where(u => u.Username.Contains(searchDto.Username));
            }

            if (!string.IsNullOrEmpty(searchDto.Email))
            {
                query = query.Where(u => u.Email.Contains(searchDto.Email));
            }

            if (!string.IsNullOrEmpty(searchDto.Role))
            {
                query = query.Where(u => u.Role == searchDto.Role);
            }

            if (searchDto.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == searchDto.IsActive.Value);
            }

            var totalCount = await query.CountAsync();

            var pageSize = Math.Max(1, searchDto.PageSize ?? 10);
            var page = Math.Max(1, searchDto.Page ?? 1);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var users = await query
                .OrderBy(u => u.Username)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FullName,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt
                })
                .ToListAsync();

            return new UserListResponseDto
            {
                Users = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<UserDetailDto?> GetUserByIdAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            return MapToUserDetailDto(user);
        }

        public async Task<UserDetailDto?> CreateUserAsync(CreateUserDto createUserDto)
        {
            try
            {
                // Check if user already exists
                if (await UserExistsAsync(createUserDto.Username, createUserDto.Email))
                {
                    _logger.LogWarning("Attempt to create user with existing username {Username} or email {Email}", 
                        createUserDto.Username, createUserDto.Email);
                    return null;
                }

                var user = new User
                {
                    Username = createUserDto.Username,
                    Email = createUserDto.Email,
                    FullName = createUserDto.FullName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                    Role = createUserDto.Role,
                    IsActive = createUserDto.IsActive,
                    CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Username} created successfully by admin", createUserDto.Username);
                return MapToUserDetailDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user {Username}", createUserDto.Username);
                return null;
            }
        }

        public async Task<UserDetailDto?> UpdateUserAsync(string userId, UpdateUserDto updateUserDto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return null;
                }

                // Check if username/email conflicts with other users
                if (!string.IsNullOrEmpty(updateUserDto.Username) || !string.IsNullOrEmpty(updateUserDto.Email))
                {
                    var usernameToCheck = updateUserDto.Username ?? user.Username;
                    var emailToCheck = updateUserDto.Email ?? user.Email;
                    
                    if (await UserExistsAsync(usernameToCheck, emailToCheck, userId))
                    {
                        _logger.LogWarning("Attempt to update user {UserId} with conflicting username or email", userId);
                        return null;
                    }
                }

                // Update fields if provided
                if (!string.IsNullOrEmpty(updateUserDto.Username))
                    user.Username = updateUserDto.Username;
                
                if (!string.IsNullOrEmpty(updateUserDto.Email))
                    user.Email = updateUserDto.Email;
                
                if (updateUserDto.FullName != null)
                    user.FullName = updateUserDto.FullName;
                
                if (!string.IsNullOrEmpty(updateUserDto.Role))
                    user.Role = updateUserDto.Role;
                
                if (updateUserDto.IsActive.HasValue)
                    user.IsActive = updateUserDto.IsActive.Value;

                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} updated successfully", userId);
                return MapToUserDetailDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} deleted successfully", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ChangeUserRoleAsync(string userId, string role)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.Role = role;
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} role changed to {Role}", userId, role);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing role for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ChangeUserStatusAsync(string userId, bool isActive)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.IsActive = isActive;
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                // If deactivating, revoke refresh tokens
                if (!isActive)
                {
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTime = null;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} status changed to {IsActive}", userId, isActive ? "active" : "inactive");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing status for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ResetUserPasswordAsync(string userId, string newPassword)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                // Revoke all refresh tokens to force re-login
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset for user {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> UserExistsAsync(string username, string email, string? excludeUserId = null)
        {
            var query = _context.Users.Where(u => u.Username == username || u.Email == email);
            
            if (!string.IsNullOrEmpty(excludeUserId))
            {
                query = query.Where(u => u.Id != excludeUserId);
            }

            return await query.AnyAsync();
        }

        private UserDetailDto MapToUserDetailDto(User user)
        {
            var permissions = _permissionService.GetRolePermissions(user.Role)
                .Select(p => GetPermissionDescription(p))
                .ToArray();

            return new UserDetailDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt,
                Permissions = permissions
            };
        }

        private static string GetPermissionDescription(Permission permission)
        {
            var field = permission.GetType().GetField(permission.ToString());
            var attribute = field?.GetCustomAttribute<DescriptionAttribute>();
            return attribute?.Description ?? permission.ToString();
        }
    }
}