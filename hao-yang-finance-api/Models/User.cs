using System.ComponentModel.DataAnnotations;

namespace hao_yang_finance_api.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? FullName { get; set; }
        
        [StringLength(20)]
        public string Role { get; set; } = "User"; // User, Admin
        
        public bool IsActive { get; set; } = true;
        
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        
        public string? LastLoginAt { get; set; }
        
        // Refresh Token 相關
        public string? RefreshToken { get; set; }
        
        public string? RefreshTokenExpiryTime { get; set; }
    }
}