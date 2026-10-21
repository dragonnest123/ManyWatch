using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using ManyWatch.Domain;
using ManyWatch.Features.Auth;
using ManyWatch.Features.Friends;
using ManyWatch.Features.Profile;
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
        public IServiceCollection AddInfrastructure(IConfiguration configuration, IHostEnvironment environment)
        {
            services
                .AddPersistence(configuration, environment)
                .AddFilters()
                .AddAuth(configuration)
                .AddAnonymousIdentity()
                .AddApi()
                .AddRealtime();

            return services;
        }

        private IServiceCollection AddPersistence(IConfiguration configuration, IHostEnvironment environment)
        {
            services.AddNpgsql<AppDbContext>(
                configuration.GetConnectionString("DefaultConnection"),
                _ => { },
                opt => opt.UseSnakeCaseNamingConvention());

            services.Configure<RoomPresenceOptions>(
                configuration.GetSection(RoomPresenceOptions.SectionName));

            if (!environment.IsEnvironment("Testing"))
            {
                services.AddHostedService<StaleRoomMemberCleanupService>();
            }

            return services;
        }

        private IServiceCollection AddFilters()
        {
            services.AddSingleton<IValidator<CreateRoomRequest>, CreateRoomValidator>();
            services.AddSingleton<IValidator<RenameRoomRequest>, RenameRoomValidator>();
            services.AddSingleton<IValidator<UpdateRoomSettingsRequest>, UpdateRoomSettingsValidator>();
            services.AddSingleton<IValidator<RegisterRequest>, RegisterValidator>();
            services.AddSingleton<IValidator<LoginRequest>, LoginValidator>();
            services.AddSingleton<IValidator<AddFriendRequest>, AddFriendRequestValidator>();
            services.AddSingleton<IValidator<InviteFriendRequest>, InviteFriendRequestValidator>();
            services.AddSingleton<IValidator<UpdateProfileRequest>, UpdateProfileValidator>();
            services.AddSingleton<IValidator<UpdateAvatarRequest>, UpdateAvatarValidator>();
            services.AddSingleton<IValidator<RecordWatchTimeRequest>, RecordWatchTimeValidator>();

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
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            // Browsers cannot attach an Authorization header to a
                            // WebSocket handshake, so SignalR passes the JWT in the
                            // query string instead.
                            var accessToken = context.Request.Query["access_token"];

                            if (!string.IsNullOrEmpty(accessToken)
                                && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
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

        private IServiceCollection AddApi()
        {
            services.ConfigureHttpJsonOptions(options =>
            {
                options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

            services.AddCors(options =>
            {
                options.AddPolicy("Client", policy =>
                {
                    policy
                        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            return services;
        }

        private IServiceCollection AddRealtime()
        {
            services.AddSignalR()
                .AddJsonProtocol(options =>
                {
                    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                });

            return services;
        }
    }
}