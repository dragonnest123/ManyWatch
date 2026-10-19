using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Hubs;

public class RoomPlaybackHub : RoomHubBase
{
    private const int MaxVideoUrlLength = 2048;

    public RoomPlaybackHub(AppDbContext db) : base(db)
    {
    }

    public async Task<RoomPlaybackResponse?> JoinRoom(Guid roomId)
    {
        await JoinRoomGroupAsync(roomId);

        var playback = await LoadPlayback(roomId);
        return playback?.ToPlaybackResponse();
    }

    public Task LeaveRoom(Guid roomId)
    {
        return LeaveRoomGroupAsync(roomId);
    }

    public async Task<RoomPlaybackResponse?> RequestPlaybackState(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var playback = await LoadPlayback(roomId);
        return playback?.ToPlaybackResponse();
    }

    public async Task UpdatePlayback(Guid roomId, UpdatePlaybackRequest request)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var videoUrl = NormalizeVideoUrl(request.VideoUrl);
        var positionSeconds = NormalizeSeconds(request.PositionSeconds);
        var durationSeconds = NormalizeSeconds(request.DurationSeconds);

        if (durationSeconds > 0)
            positionSeconds = Math.Min(positionSeconds, durationSeconds);

        var playback = await Db.RoomPlaybacks
            .FirstOrDefaultAsync(playback => playback.RoomId == roomId);

        if (playback is null)
        {
            if (videoUrl is null)
                throw new HubException("Select a video before synchronizing playback");

            playback = new RoomPlayback(roomId);
            Db.RoomPlaybacks.Add(playback);
        }

        playback.Update(
            videoUrl ?? playback.VideoUrl,
            request.IsPlaying,
            positionSeconds,
            durationSeconds,
            userId);

        await Db.SaveChangesAsync();

        await Clients
            .Group(GroupName(roomId))
            .SendAsync("PlaybackUpdated", playback.ToPlaybackResponse());
    }

    private Task<RoomPlayback?> LoadPlayback(Guid roomId)
    {
        return Db.RoomPlaybacks
            .AsNoTracking()
            .FirstOrDefaultAsync(playback => playback.RoomId == roomId);
    }

    private static double NormalizeSeconds(double value)
    {
        return double.IsFinite(value) ? Math.Max(0, value) : 0;
    }

    private static string? NormalizeVideoUrl(string? videoUrl)
    {
        if (videoUrl is null)
            return null;

        var trimmed = videoUrl.Trim();
        if (trimmed.Length == 0)
            return null;

        if (trimmed.Length > MaxVideoUrlLength)
            throw new HubException($"Video URL must be {MaxVideoUrlLength} characters or fewer");

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new HubException("Video URL must be a valid http(s) link");

        return trimmed;
    }
}
