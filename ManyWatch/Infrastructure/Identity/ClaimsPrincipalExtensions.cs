using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ManyWatch.Infrastructure.Identity;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Account id from the JWT. This is intentionally separate from the anonymous
    /// room identity issued by <see cref="AnonymousIdentityMiddleware"/>.
    /// </summary>
    public static Guid GetAccountUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(value, out var userId))
            throw new InvalidOperationException("Authenticated account id is not available");

        return userId;
    }
}
