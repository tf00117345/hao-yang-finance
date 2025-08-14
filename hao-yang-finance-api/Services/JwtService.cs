using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using hao_yang_finance_api.Models;

namespace hao_yang_finance_api.Services
{
    public interface IJwtService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
        bool ValidateToken(string token);
        DateTime GetTokenExpiration(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtService> _logger;

        public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateAccessToken(User user)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? _configuration["JWT:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? _configuration["JWT:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");
            var jwtExpireMinutes = Environment.GetEnvironmentVariable("JWT_EXPIRE_MINUTES") ?? _configuration["JWT:ExpireMinutes"] ?? throw new InvalidOperationException("JWT Expire Minutes is not configured");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName ?? ""),
                new Claim("IsActive", user.IsActive.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, 
                    new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                    ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtExpireMinutes)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            try
            {
                var jwtKey = _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
                var jwtIssuer = _configuration["JWT:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
                var jwtAudience = _configuration["JWT:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateAudience = true,
                    ValidateIssuer = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ValidateLifetime = false, // 不驗證過期時間，因為我們想要從過期的token中獲取claims
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    ClockSkew = TimeSpan.Zero
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

                if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    throw new SecurityTokenException("Invalid token");
                }

                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting principal from expired token");
                return null;
            }
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var jwtKey = _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
                var jwtIssuer = _configuration["JWT:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
                var jwtAudience = _configuration["JWT:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");

                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token validation failed");
                return false;
            }
        }

        public DateTime GetTokenExpiration(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwt = tokenHandler.ReadJwtToken(token);
                return jwt.ValidTo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting token expiration");
                return DateTime.MinValue;
            }
        }
    }
}