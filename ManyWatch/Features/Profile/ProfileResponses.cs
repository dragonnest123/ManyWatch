namespace ManyWatch.Features.Profile;

public sealed record ProfileResponse(
    Guid UserId,
    string Email,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTime CreatedAt,
    long WatchedSeconds,
    int FriendCount);

public sealed record AvatarResponse(
    string AvatarUrl);

public sealed record WatchTimeResponse(
    long WatchedSeconds);
