using ManyWatch.Domain;
using ManyWatch.Features.Profile;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Login
{
    public static async Task<IResult> Handle(
        LoginRequest request,
        AppDbContext db,
        PasswordHasher<User> passwordHasher,
        JwtTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await db.Users
            .FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
        if (user is null)
            return Results.Json(new { error = "Invalid email or password" }, statusCode: StatusCodes.Status401Unauthorized);

        var verificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
            return Results.Json(new { error = "Invalid email or password" }, statusCode: StatusCodes.Status401Unauthorized);

        var (accessToken, expiresAt) = tokenService.GenerateAccessToken(user);
        var refreshToken = JwtTokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken(
            user.Id,
            JwtTokenService.HashRefreshToken(refreshToken),
            tokenService.RefreshTokenExpiry()));

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new AuthResponse(user.Id, user.Email, user.DisplayName, accessToken, refreshToken, expiresAt, ProfileMapping.AvatarUrl(user)));
    }
}
