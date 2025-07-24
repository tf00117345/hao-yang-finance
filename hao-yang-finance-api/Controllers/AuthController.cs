using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using hao_yang_finance_api.Services;
using hao_yang_finance_api.DTOs;

namespace hao_yang_finance_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// 用戶登入
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.LoginAsync(loginDto);
                if (result == null)
                {
                    return Unauthorized(new { message = "用戶名或密碼錯誤" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error for user {Username}", loginDto.Username);
                return StatusCode(500, new { message = "登入時發生錯誤" });
            }
        }

        /// <summary>
        /// 用戶註冊
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RegisterAsync(registerDto);
                if (result == null)
                {
                    return Conflict(new { message = "用戶名或電子郵件已存在" });
                }

                return CreatedAtAction(nameof(GetProfile), new { }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration error for user {Username}", registerDto.Username);
                return StatusCode(500, new { message = "註冊時發生錯誤" });
            }
        }

        /// <summary>
        /// 刷新訪問令牌
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<ActionResult<TokenResponseDto>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);
                if (result == null)
                {
                    return Unauthorized(new { message = "無效或過期的刷新令牌" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token refresh error");
                return StatusCode(500, new { message = "刷新令牌時發生錯誤" });
            }
        }

        /// <summary>
        /// 用戶登出
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout([FromBody] RefreshTokenDto refreshTokenDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RevokeTokenAsync(refreshTokenDto.RefreshToken);
                if (!result)
                {
                    return BadRequest(new { message = "無效的刷新令牌" });
                }

                return Ok(new { message = "登出成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout error");
                return StatusCode(500, new { message = "登出時發生錯誤" });
            }
        }

        /// <summary>
        /// 獲取當前用戶資料
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "無效的用戶令牌" });
                }

                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "用戶不存在" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get profile error");
                return StatusCode(500, new { message = "獲取用戶資料時發生錯誤" });
            }
        }

        /// <summary>
        /// 修改密碼
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "無效的用戶令牌" });
                }

                var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);
                if (!result)
                {
                    return BadRequest(new { message = "當前密碼錯誤或用戶不存在" });
                }

                return Ok(new { message = "密碼修改成功，請重新登入" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Change password error for user {UserId}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "修改密碼時發生錯誤" });
            }
        }

        /// <summary>
        /// 驗證令牌有效性
        /// </summary>
        [HttpGet("verify-token")]
        [Authorize]
        public ActionResult VerifyToken()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new
            {
                message = "令牌有效",
                userId,
                username,
                role,
                isAuthenticated = true
            });
        }
    }
}