using ManyWatch.Domain;

namespace ManyWatch.Features.Rooms;

public sealed record GetRoomResponse(
    Guid Id,
    string Name,
    bool IsPrivate,
    int? MaxMembers,
    RoomJoinPolicy JoinPolicy,
    IReadOnlyCollection<RoomMemberResponse> Members,
    IReadOnlyCollection<BannedMemberResponse> Bans,
    RoomPlaybackResponse? Playback);

public sealed record RoomItemResponse(
    Guid Id,
    string Name,
    bool IsPrivate,
    int MemberCount,
    int? MaxMembers,
    RoomJoinPolicy JoinPolicy);

public sealed record RoomMemberResponse(
    Guid UserId,
    DateTime JoinedAt,
    bool IsHost,
    bool IsMe);

public sealed record BannedMemberResponse(
    Guid UserId,
    DateTime BannedAt);

public sealed record RoomPlaybackResponse(
    string? VideoUrl,
    bool IsPlaying,
    double PositionSeconds,
    double DurationSeconds,
    DateTime UpdatedAtUtc,
    Guid UpdatedByUserId);
