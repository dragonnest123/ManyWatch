using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms;

public class RoomHub : Hub
{
    private const int MaxVideoUrlLength = 2048;
    private const int RecentMessagesCount = 100;

    private readonly AppDbContext _db;

    public RoomHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RoomPlaybackResponse?> JoinRoom(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(roomId));

        var playback = await LoadPlayback(roomId);
        return playback?.ToPlaybackResponse();
    }

    public Task LeaveRoom(Guid roomId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(roomId));
    }

    public async Task<RoomPlaybackResponse?> RequestPlaybackState(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var playback = await LoadPlayback(roomId);
        return playback?.ToPlaybackResponse();
    }

    public async Task<IReadOnlyList<ChatMessageResponse>> GetMessages(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Where(message => message.RoomId == roomId)
            .OrderByDescending(message => message.SentAt)
            .ThenByDescending(message => message.Id)
            .Take(RecentMessagesCount)
            .ToListAsync();

        return messages
            .OrderBy(message => message.SentAt)
            .ThenBy(message => message.Id)
            .Select(message => message.ToChatMessageResponse())
            .ToArray();
    }

    public async Task SendMessage(Guid roomId, SendChatMessageRequest? request)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var content = NormalizeChatMessage(request?.Content);
        var message = new ChatMessage(roomId, userId, content);

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        await Clients
            .Group(GroupName(roomId))
            .SendAsync("ChatMessageReceived", message.ToChatMessageResponse());
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

        var playback = await _db.RoomPlaybacks
            .FirstOrDefaultAsync(playback => playback.RoomId == roomId);

        if (playback is null)
        {
            if (videoUrl is null)
                throw new HubException("Select a video before synchronizing playback");

            playback = new RoomPlayback(roomId);
            _db.RoomPlaybacks.Add(playback);
        }

        playback.Update(
            videoUrl ?? playback.VideoUrl,
            request.IsPlaying,
            positionSeconds,
            durationSeconds,
            userId);

        await _db.SaveChangesAsync();

        await Clients
            .Group(GroupName(roomId))
            .SendAsync("PlaybackUpdated", playback.ToPlaybackResponse());
    }

    private Guid GetUserId()
    {
        var httpContext = Context.GetHttpContext()
            ?? throw new HubException("Anonymous identity is not available for this connection");

        return httpContext.GetAnonymousUserId();
    }

    private async Task EnsureMembership(Guid roomId, Guid userId)
    {
        var isMember = await _db.RoomMembers
            .AnyAsync(member => member.RoomId == roomId && member.UserId == userId);

        if (!isMember)
            throw new HubException("You are not a member of this room");
    }

    private Task<RoomPlayback?> LoadPlayback(Guid roomId)
    {
        return _db.RoomPlaybacks
            .AsNoTracking()
            .FirstOrDefaultAsync(playback => playback.RoomId == roomId);
    }

    private static string GroupName(Guid roomId)
    {
        return $"room-{roomId:N}";
    }

    private static double NormalizeSeconds(double value)
    {
        return double.IsFinite(value) ? Math.Max(0, value) : 0;
    }

    private static string NormalizeChatMessage(string? content)
    {
        var trimmed = content?.Trim();

        if (string.IsNullOrEmpty(trimmed))
            throw new HubException("Message cannot be empty");

        if (trimmed.Length > ChatMessage.MaxContentLength)
            throw new HubException($"Message must be {ChatMessage.MaxContentLength} characters or fewer");

        return trimmed;
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
