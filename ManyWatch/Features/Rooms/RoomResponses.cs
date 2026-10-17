namespace ManyWatch.Features.Rooms;

public sealed record GetRoomResponse(
    Guid Id,
    string Name,
    bool IsPrivate,
    IReadOnlyCollection<RoomMemberResponse> Members,
    IReadOnlyCollection<BannedMemberResponse> Bans);

public sealed record RoomItemResponse(
    Guid Id,
    string Name,
    bool IsPrivate,
    int MemberCount);

public sealed record RoomMemberResponse(
    Guid UserId,
    DateTime JoinedAt,
    bool IsHost,
    bool IsMe);

public sealed record BannedMemberResponse(
    Guid UserId,
    DateTime BannedAt);
