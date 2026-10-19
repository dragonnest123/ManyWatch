using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Hubs;

public class RoomChatHub : RoomHubBase
{
    private const int RecentMessagesCount = 100;

    public RoomChatHub(AppDbContext db) : base(db)
    {
    }

    public Task JoinRoom(Guid roomId)
    {
        return JoinRoomGroupAsync(roomId);
    }

    public Task LeaveRoom(Guid roomId)
    {
        return LeaveRoomGroupAsync(roomId);
    }

    public async Task<IReadOnlyList<ChatMessageResponse>> GetMessages(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);

        var messages = await Db.ChatMessages
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

        Db.ChatMessages.Add(message);
        await Db.SaveChangesAsync();

        await Clients
            .Group(GroupName(roomId))
            .SendAsync("ChatMessageReceived", message.ToChatMessageResponse());
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
}
