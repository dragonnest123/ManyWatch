namespace ManyWatch.Features.Rooms;

public sealed record RoomResponse(
    Guid Id,
    Guid HostId,
    string Name,
    bool IsPrivate,
    DateTime CreatedAt,
    IReadOnlyCollection<RoomMemberResponse> Members);

public sealed record RoomMemberResponse(
    Guid UserId,
    DateTime JoinedAt,
    bool IsHost);