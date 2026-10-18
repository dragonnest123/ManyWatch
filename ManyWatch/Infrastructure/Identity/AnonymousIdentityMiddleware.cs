namespace ManyWatch.Infrastructure.Identity;

public sealed class AnonymousIdentityMiddleware
{
    public const string CookieName = "manywatch.anon";

    private static readonly TimeSpan CookieLifetime = TimeSpan.FromDays(365);

    private readonly RequestDelegate _next;

    public AnonymousIdentityMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        AnonymousIdProtector protector,
        IHostEnvironment environment)
    {
        var userId = ResolveUserId(context, protector) ?? IssueUserId(context, protector, environment);

        context.SetAnonymousUserId(userId);

        await _next(context);
    }

    private static Guid? ResolveUserId(HttpContext context, AnonymousIdProtector protector)
    {
        var cookie = context.Request.Cookies[CookieName];

        return string.IsNullOrEmpty(cookie) ? null : protector.Unprotect(cookie);
    }

    private static Guid IssueUserId(
        HttpContext context,
        AnonymousIdProtector protector,
        IHostEnvironment environment)
    {
        var userId = Guid.CreateVersion7();

        context.Response.Cookies.Append(
            CookieName,
            protector.Protect(userId),
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !environment.IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = CookieLifetime,
                IsEssential = true,
            });

        return userId;
    }
}
