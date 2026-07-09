using ManyWatch.Domain;

namespace ManyWatch.Features.Rooms;

public static class RoomMapping
{
    public static RoomResponse ToResponse(this Room room)
    {
        return new RoomResponse(
            room.Id,
            room.HostId,
            room.Name,
            room.IsPrivate,
            room.CreatedAt,
            room.Members
                .OrderByDescending(member => member.IsHost)
                .ThenBy(member => member.JoinedAt)
                .Select(member => new RoomMemberResponse(
                    member.UserId,
                    member.JoinedAt,
                    member.IsHost))
                .ToArray());
    }
}