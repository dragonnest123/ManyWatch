using ManyWatch.Features.Friends;

namespace ManyWatch.Features.Profile;

public sealed record ProfileResponse(
    Guid UserId,
    string Email,
    string Username,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTime CreatedAt,
    long WatchedSeconds,
    int FriendCount);

public sealed record PublicProfileResponse(
    Guid UserId,
    string Username,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTime CreatedAt,
    int FriendCount,
    FriendRelationship Relationship,
    bool IsSelf);

public sealed record AvatarResponse(
    string AvatarUrl);

public sealed record WatchTimeResponse(
    long WatchedSeconds);
