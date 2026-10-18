using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Me
{
    public static IResult Handle(ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var email = user.FindFirstValue(JwtRegisteredClaimNames.Email);
        var displayName = user.FindFirstValue(JwtRegisteredClaimNames.Name);
        var createdAt = user.FindFirstValue("created_at");

        if (userId is null || email is null || displayName is null || createdAt is null)
            return Results.Unauthorized();

        return Results.Ok(new MeResponse(Guid.Parse(userId), email, displayName, DateTime.Parse(createdAt, null, System.Globalization.DateTimeStyles.RoundtripKind)));
    }
}
