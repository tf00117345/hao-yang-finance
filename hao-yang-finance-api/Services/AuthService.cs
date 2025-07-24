using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Data;

namespace hao_yang_finance_api.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginDto loginDto);
        Task<UserDto?> RegisterAsync(RegisterDto registerDto);
        Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(string refreshToken);
        Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
        Task<UserDto?> GetUserByIdAsync(string userId);
        Task<bool> UpdateLastLoginAsync(string userId);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            ApplicationDbContext context,
            IJwtService jwtService,
            ILogger<AuthService> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _logger = logger;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("Login failed: User {Username} not found or inactive", loginDto.Username);
                    return null;
                }

                if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    _logger.LogWarning("Login failed: Invalid password for user {Username}", loginDto.Username);
                    return null;
                }

                // 生成新的 access token 和 refresh token
                var accessToken = _jwtService.GenerateAccessToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // 更新用戶的 refresh token 和最後登入時間
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ"); // 7天過期
                user.LastLoginAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                var tokenExpiration = _jwtService.GetTokenExpiration(accessToken);

                return new LoginResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    User = MapToUserDto(user),
                    ExpiresAt = tokenExpiration.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for user {Username}", loginDto.Username);
                return null;
            }
        }

        public async Task<UserDto?> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // 檢查用戶名和電子郵件是否已存在
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == registerDto.Username || u.Email == registerDto.Email);

                if (existingUser != null)
                {
                    _logger.LogWarning("Registration failed: Username {Username} or Email {Email} already exists", 
                        registerDto.Username, registerDto.Email);
                    return null;
                }

                // 創建新用戶
                var user = new User
                {
                    Username = registerDto.Username,
                    Email = registerDto.Email,
                    FullName = registerDto.FullName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Role = "User", // 預設角色
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Username} registered successfully", registerDto.Username);
                return MapToUserDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for user {Username}", registerDto.Username);
                return null;
            }
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.IsActive);

                if (user == null || string.IsNullOrEmpty(user.RefreshTokenExpiryTime))
                {
                    _logger.LogWarning("Refresh token failed: Token not found or user inactive");
                    return null;
                }

                // 檢查 refresh token 是否過期
                if (!DateTime.TryParse(user.RefreshTokenExpiryTime, out var expiryTime) || 
                    expiryTime <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Refresh token failed: Token expired for user {UserId}", user.Id);
                    
                    // 清除過期的 refresh token
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTime = null;
                    await _context.SaveChangesAsync();
                    
                    return null;
                }

                // 生成新的 access token 和 refresh token
                var newAccessToken = _jwtService.GenerateAccessToken(user);
                var newRefreshToken = _jwtService.GenerateRefreshToken();

                // 更新 refresh token
                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ");
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();

                var tokenExpiration = _jwtService.GetTokenExpiration(newAccessToken);

                return new TokenResponseDto
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    ExpiresAt = tokenExpiration.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                return null;
            }
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

                if (user == null)
                {
                    return false;
                }

                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking token");
                return false;
            }
        }

        public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return false;
                }

                if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    _logger.LogWarning("Password change failed: Invalid current password for user {UserId}", userId);
                    return false;
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                
                // 撤銷所有現有的 refresh token，強制重新登入
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                return false;
            }
        }

        public async Task<UserDto?> GetUserByIdAsync(string userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

                return user != null ? MapToUserDto(user) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> UpdateLastLoginAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.LastLoginAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                user.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating last login for user {UserId}", userId);
                return false;
            }
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            };
        }
    }
}