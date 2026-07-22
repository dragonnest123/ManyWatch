using ManyWatch.Domain;

namespace ManyWatch.Features.Rooms;

public static class RoomMapping
{
    extension(Room room)
    {
        public GetRoomResponse ToGetRoomResponse()
        {
            return new GetRoomResponse(
                room.Id,
                room.Name,
                room.IsPrivate,
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
}