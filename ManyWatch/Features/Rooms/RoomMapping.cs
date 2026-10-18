using ManyWatch.Domain;

namespace ManyWatch.Features.Rooms;

public static class RoomMapping
{
    extension(Room room)
    {
        public GetRoomResponse ToGetRoomResponse(Guid viewerId)
        {
            var isHost = room.HostId == viewerId;

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
                        member.IsHost,
                        member.UserId == viewerId))
                    .ToArray(),
                isHost
                    ? room.Bans
                        .OrderByDescending(ban => ban.BannedAt)
                        .Select(ban => new BannedMemberResponse(ban.UserId, ban.BannedAt))
                        .ToArray()
                    : []);
        }
    }
}
