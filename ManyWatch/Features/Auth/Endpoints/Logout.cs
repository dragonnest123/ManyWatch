using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Logout
{
    public static async Task<IResult> Handle(
        LogoutRequest request,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var tokenHash = JwtTokenService.HashRefreshToken(request.RefreshToken);

        var existingToken = await db.RefreshTokens
            .FirstOrDefaultAsync(refreshToken => refreshToken.TokenHash == tokenHash, cancellationToken);

        if (existingToken is not null && existingToken.RevokedAt is null)
        {
            existingToken.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return Results.NoContent();
    }
}
