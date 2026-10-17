namespace ManyWatch.Features.Rooms;

public sealed record CreateRoomRequest(
    string Name,
    bool IsPrivate = false);
