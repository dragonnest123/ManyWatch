using ManyWatch.Features.Profile;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Refresh
{
    public static async Task<IResult> Handle(
        RefreshRequest request,
        AppDbContext db,
        JwtTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var tokenHash = JwtTokenService.HashRefreshToken(request.RefreshToken);

        var existingToken = await db.RefreshTokens
            .Include(refreshToken => refreshToken.User)
            .FirstOrDefaultAsync(refreshToken => refreshToken.TokenHash == tokenHash, cancellationToken);

        if (existingToken?.User is null || !existingToken.IsActive)
            return Results.Json(new { error = "Invalid or expired refresh token" }, statusCode: StatusCodes.Status401Unauthorized);

        existingToken.RevokedAt = DateTime.UtcNow;

        var user = existingToken.User;
        var (accessToken, expiresAt) = tokenService.GenerateAccessToken(user);
        var newRefreshToken = JwtTokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new Domain.RefreshToken(
            user.Id,
            JwtTokenService.HashRefreshToken(newRefreshToken),
            tokenService.RefreshTokenExpiry()));

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new AuthResponse(user.Id, user.Email, user.DisplayName, accessToken, newRefreshToken, expiresAt, ProfileMapping.AvatarUrl(user)));
    }
}
