using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ??
                          "Host=localhost;Database=hao_yang_finance;Username=postgres;Password=your_password"));
}
else
{
    // Add Entity Framework with PostgreSQL for Railway
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        var connectionString = "";

        // Try to get Railway DATABASE_URL
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

        if (!string.IsNullOrEmpty(databaseUrl))
        {
            // Parse PostgreSQL URL to standard format for Railway
            try
            {
                Console.WriteLine($"Database URL: {databaseUrl}");
                var uri = new Uri(databaseUrl);
                connectionString =
                    $"Host={uri.Host};Port={uri.Port};Database={uri.LocalPath.TrimStart('/')};Username={uri.UserInfo.Split(':')[0]};Password={uri.UserInfo.Split(':')[1]};";
            }
            catch
            {
                // If URL parsing fails, try individual variables
                databaseUrl = null;
            }
        }

        Console.WriteLine(
            $"Using connection string: Host={connectionString?.Split(';')[0]};Database={connectionString?.Split(';')[2]};...");
        options.UseNpgsql(connectionString);
    });
}


// Add Authentication Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Add Permission and User Management Services
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();

// Add JWT Authentication
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ??
             builder.Configuration["JWT:Key"] ??
             throw new InvalidOperationException("JWT Key is not configured");

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ??
                builder.Configuration["JWT:Issuer"] ??
                throw new InvalidOperationException("JWT Issuer is not configured");

var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ??
                  builder.Configuration["JWT:Audience"] ??
                  throw new InvalidOperationException("JWT Audience is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                context.Response.Headers.Add("Token-Expired", "true");
            }

            return Task.CompletedTask;
        }
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
                                 ?? new[] { "http://localhost:5173", "http://localhost:3000" };

            if (builder.Environment.IsProduction())
            {
                // In production, use specific frontend URL from environment variable
                var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
                if (!string.IsNullOrEmpty(frontendUrl))
                {
                    allowedOrigins = new[] { frontendUrl };
                }
            }

            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirection in development
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

app.Run();