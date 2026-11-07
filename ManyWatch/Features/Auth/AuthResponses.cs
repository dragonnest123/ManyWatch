namespace ManyWatch.Features.Auth;

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string Username,
    string DisplayName,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    string? AvatarUrl);

public sealed record MeResponse(
    Guid UserId,
    string Email,
    string Username,
    string DisplayName,
    DateTime CreatedAt,
    string? AvatarUrl);
