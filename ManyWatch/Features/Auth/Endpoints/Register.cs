using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Register
{
    public static async Task<IResult> Handle(
        RegisterRequest request,
        AppDbContext db,
        PasswordHasher<User> passwordHasher,
        JwtTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await db.Users
            .AnyAsync(user => user.Email == email, cancellationToken);
        if (emailTaken)
            return Results.Conflict(new { error = "This email is already registered." });

        var user = new User(email, passwordHash: "", request.DisplayName.Trim());
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);

        var (accessToken, expiresAt) = tokenService.GenerateAccessToken(user);
        var refreshToken = JwtTokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken(
            user.Id,
            JwtTokenService.HashRefreshToken(refreshToken),
            tokenService.RefreshTokenExpiry()));

        await db.SaveChangesAsync(cancellationToken);

        return Results.Created(
            "/auth/me",
            new AuthResponse(user.Id, user.Email, user.DisplayName, accessToken, refreshToken, expiresAt));
    }
}
