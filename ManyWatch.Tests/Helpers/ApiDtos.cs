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

public sealed record FriendDto(
    Guid UserId,
    string DisplayName,
    string Email,
    DateTime FriendsSince);

public sealed record FriendRequestDto(
    Guid Id,
    Guid UserId,
    string DisplayName,
    string Email,
    DateTime CreatedAt);

public sealed record FriendRequestsDto(
    IReadOnlyList<FriendRequestDto> Incoming,
    IReadOnlyList<FriendRequestDto> Outgoing);

public sealed record UserSearchResultDto(
    Guid UserId,
    string DisplayName,
    string Email,
    string Relationship);

public sealed record RoomInvitationDto(
    Guid Id,
    Guid RoomId,
    string RoomName,
    Guid SenderId,
    string SenderDisplayName,
    DateTime CreatedAt);

public sealed record AcceptedRoomInvitationDto(
    Guid RoomId);

public sealed record DirectMessageDto(
    Guid Id,
    Guid SenderId,
    Guid RecipientId,
    string Content,
    DateTime SentAtUtc);
