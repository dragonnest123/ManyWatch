using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ManyWatch.Tests.Helpers;

/// <summary>
/// Boots the real application (middleware, auth, endpoints, SignalR hub) on an
/// in-memory database so tests never need Docker or a live PostgreSQL instance.
/// </summary>
public sealed class ManyWatchAppFactory : WebApplicationFactory<Program>
{
    // A valid 256-bit base64 key; regenerated per test process.
    private static readonly string TestJwtKey =
        Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

    private readonly string _databaseName = $"manywatch-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // UseSetting writes host configuration that Program already sees while
        // registering services, unlike ConfigureAppConfiguration.
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused;Database=unused");
        builder.UseSetting("Jwt:Issuer", "ManyWatch");
        builder.UseSetting("Jwt:Audience", "ManyWatch.Client");
        builder.UseSetting("Jwt:Key", TestJwtKey);
        builder.UseSetting("Jwt:AccessTokenMinutes", "15");
        builder.UseSetting("Jwt:RefreshTokenDays", "30");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
