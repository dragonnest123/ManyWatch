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
                room.Settings.IsPrivate,
                room.Settings.MaxMembers,
                room.Settings.JoinPolicy,
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
                    : [],
                room.Playback?.ToPlaybackResponse());
        }
    }

    extension(RoomPlayback playback)
    {
        public RoomPlaybackResponse ToPlaybackResponse()
        {
            return new RoomPlaybackResponse(
                playback.VideoUrl,
                playback.IsPlaying,
                playback.GetEffectivePositionSeconds(),
                playback.DurationSeconds,
                playback.UpdatedAt,
                playback.UpdatedByUserId);
        }
    }
}
