using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using hao_yang_finance_api.Models;
using hao_yang_finance_api.Services;

namespace hao_yang_finance_api.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
    {
        private readonly Permission _permission;

        public RequirePermissionAttribute(Permission permission)
        {
            _permission = permission;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Get permission service from DI container
            var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();

            if (permissionService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Check if user is authenticated
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Check if user has required permission
            if (!permissionService.HasPermission(context.HttpContext.User, _permission))
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }

    // Helper attribute for Admin-only operations
    public class AdminOnlyAttribute : RequirePermissionAttribute
    {
        public AdminOnlyAttribute() : base(Permission.UserRead) // Using UserRead as a proxy for admin check
        {
        }

        public new void OnAuthorization(AuthorizationFilterContext context)
        {
            var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();

            if (permissionService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            if (!permissionService.IsAdmin(context.HttpContext.User))
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}