using FluentValidation;
using ManyWatch.Domain;
using ManyWatch.Features.Auth;
using ManyWatch.Features.Rooms;
using ManyWatch.Infrastructure.BackgroundServices;
using ManyWatch.Infrastructure.Configuration;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ManyWatch.Infrastructure;

public static class DependencyInjection
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddInfrastructure(IConfiguration configuration)
        {
            services
                .AddPersistence(configuration)
                .AddFilters()
                .AddAuth(configuration)
                .AddAnonymousIdentity();

            return services;
        }

        private IServiceCollection AddPersistence(IConfiguration configuration)
        {
            services.AddNpgsql<AppDbContext>(
                configuration.GetConnectionString("DefaultConnection"),
                _ => { },
                opt => opt.UseSnakeCaseNamingConvention());

            services.Configure<RoomPresenceOptions>(
                configuration.GetSection(RoomPresenceOptions.SectionName));
            services.AddHostedService<StaleRoomMemberCleanupService>();

            return services;
        }

        private IServiceCollection AddFilters()
        {
            services.AddSingleton<IValidator<CreateRoomRequest>, CreateRoomValidator>();
            services.AddSingleton<IValidator<RegisterRequest>, RegisterValidator>();
            services.AddSingleton<IValidator<LoginRequest>, LoginValidator>();

            return services;
        }

        private IServiceCollection AddAuth(IConfiguration configuration)
        {
            var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                ?? throw new InvalidOperationException("Jwt configuration section is missing.");

            services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
            services.AddSingleton<JwtTokenService>();
            services.AddSingleton<PasswordHasher<User>>();

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.MapInboundClaims = false;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidateAudience = true,
                        ValidAudience = jwtOptions.Audience,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwtOptions.Key)),
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromSeconds(30),
                    };
                });

            services.AddAuthorization();

            return services;
        }

        private IServiceCollection AddAnonymousIdentity()
        {
            services.AddDataProtection();
            services.AddSingleton<AnonymousIdProtector>();

            return services;
        }
    }
}