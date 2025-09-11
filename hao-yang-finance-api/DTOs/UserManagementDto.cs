using System.ComponentModel.DataAnnotations;

namespace hao_yang_finance_api.DTOs
{
    public class CreateUserDto
    {
        [Required(ErrorMessage = "用戶名不能為空")]
        [StringLength(50, ErrorMessage = "用戶名長度不能超過50個字元")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "電子郵件不能為空")]
        [EmailAddress(ErrorMessage = "請輸入有效的電子郵件地址")]
        [StringLength(100, ErrorMessage = "電子郵件長度不能超過100個字元")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "密碼不能為空")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "密碼長度必須在6-100個字元之間")]
        public string Password { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "全名長度不能超過100個字元")]
        public string? FullName { get; set; }

        [Required(ErrorMessage = "角色不能為空")]
        [RegularExpression("^(Admin|Accountant|Driver)$", ErrorMessage = "角色必須是 Admin、Accountant、Driver 之一")]
        public string Role { get; set; } = "User";

        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserDto
    {
        [StringLength(50, ErrorMessage = "用戶名長度不能超過50個字元")]
        public string? Username { get; set; }

        [EmailAddress(ErrorMessage = "請輸入有效的電子郵件地址")]
        [StringLength(100, ErrorMessage = "電子郵件長度不能超過100個字元")]
        public string? Email { get; set; }

        [StringLength(100, ErrorMessage = "全名長度不能超過100個字元")]
        public string? FullName { get; set; }

        [RegularExpression("^(Admin|Accountant|Driver)$", ErrorMessage = "角色必須是 Admin、Accountant 或 Driver 之一")]
        public string? Role { get; set; }

        public bool? IsActive { get; set; }
    }

    public class ChangeUserRoleDto
    {
        [Required(ErrorMessage = "角色不能為空")]
        [RegularExpression("^(Admin|Accountant|Driver)$", ErrorMessage = "角色必須是 Admin、Accountant 或 Driver 之一")]
        public string Role { get; set; } = string.Empty;
    }

    public class ChangeUserStatusDto
    {
        [Required(ErrorMessage = "狀態不能為空")]
        public bool IsActive { get; set; }
    }

    public class ResetUserPasswordDto
    {
        [Required(ErrorMessage = "新密碼不能為空")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "密碼長度必須在6-100個字元之間")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UserListDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string? LastLoginAt { get; set; }
    }

    public class UserDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
        public string? LastLoginAt { get; set; }
        public string[]? Permissions { get; set; }
    }

    public class UserSearchDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public int? PageSize { get; set; } = 10;
        public int? Page { get; set; } = 1;
    }

    public class UserListResponseDto
    {
        public List<UserListDto> Users { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}