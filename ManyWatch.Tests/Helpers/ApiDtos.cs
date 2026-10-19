namespace ManyWatch.Tests.Helpers;

public sealed record RoomDto(
    Guid Id,
    string Name,
    bool IsPrivate,
    int? MaxMembers,
    string JoinPolicy,
    IReadOnlyList<RoomMemberDto> Members,
    IReadOnlyList<RoomBanDto> Bans,
    RoomPlaybackDto? Playback);

public sealed record RoomMemberDto(
    Guid UserId,
    DateTime JoinedAt,
    bool IsHost,
    bool IsMe);

public sealed record RoomBanDto(
    Guid UserId,
    DateTime BannedAt);

public sealed record RoomPlaybackDto(
    string? VideoUrl,
    bool IsPlaying,
    double PositionSeconds,
    double DurationSeconds,
    DateTime UpdatedAtUtc,
    Guid UpdatedByUserId);

public sealed record ChatMessageDto(
    Guid Id,
    Guid UserId,
    string Content,
    DateTime SentAtUtc);

public sealed record AuthDto(
    Guid UserId,
    string Email,
    string DisplayName,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);

public sealed record MeDto(
    Guid UserId,
    string Email,
    string DisplayName,
    DateTime CreatedAt);
