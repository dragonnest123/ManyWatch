using ManyWatch.Infrastructure.EndpointFilters;

namespace ManyWatch.Features.Auth.Endpoints;

public static class AuthEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication MapAuthEndpoints()
        {
            var auth = app.MapGroup("/auth")
                .WithTags("Auth");

            auth.MapPost("/register", Register.Handle)
                .AddEndpointFilter<ValidationFilter<RegisterRequest>>()
                .WithTags("Register");

            auth.MapPost("/login", Login.Handle)
                .AddEndpointFilter<ValidationFilter<LoginRequest>>()
                .WithTags("Login");

            auth.MapPost("/refresh", Refresh.Handle)
                .WithTags("Refresh");

            auth.MapPost("/logout", Logout.Handle)
                .WithTags("Logout");

            auth.MapGet("/me", Me.Handle)
                .RequireAuthorization()
                .WithTags("Me");

            return app;
        }
    }
}
