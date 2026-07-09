namespace ManyWatch.Features.Rooms;

public sealed record CreateRoomRequest(
    Guid HostId,
    string Name,
    bool IsPrivate = false);

public sealed record JoinRoomRequest(Guid UserId, Guid RoomId);

public sealed record LeaveRoomRequest(Guid UserId, Guid RoomId);

public sealed record DeleteRoomRequest(Guid UserId, Guid RoomId);