namespace ManyWatch.Features.Rooms;

public sealed record CreateRoomRequest(
    Guid HostId,
    string Name,
    bool IsPrivate = false);