using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends;

[Authorize]
public class FriendsHub : Hub
{
    private const int RecentMessagesCount = 100;

    private readonly AppDbContext _db;
    private readonly FriendsPresenceTracker _presence;

    public FriendsHub(AppDbContext db, FriendsPresenceTracker presence)
    {
        _db = db;
        _presence = presence;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

        if (_presence.AddConnection(userId))
        {
            await NotifyFriendsPresenceAsync(userId, isOnline: true);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var value = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (Guid.TryParse(value, out var userId) && _presence.RemoveConnection(userId))
        {
            await NotifyFriendsPresenceAsync(userId, isOnline: false);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<IReadOnlyList<DirectMessageResponse>> GetMessages(Guid friendId)
    {
        var userId = GetUserId();
        await EnsureFriendship(userId, friendId);

        var messages = await _db.DirectMessages
            .AsNoTracking()
            .Where(message =>
                (message.SenderId == userId && message.RecipientId == friendId)
                || (message.SenderId == friendId && message.RecipientId == userId))
            .OrderByDescending(message => message.SentAt)
            .ThenByDescending(message => message.Id)
            .Take(RecentMessagesCount)
            .ToListAsync();

        return messages
            .OrderBy(message => message.SentAt)
            .ThenBy(message => message.Id)
            .Select(message => message.ToDirectMessageResponse())
            .ToArray();
    }

    public async Task SendMessage(Guid friendId, SendDirectMessageRequest? request)
    {
        var userId = GetUserId();
        await EnsureFriendship(userId, friendId);

        var content = NormalizeDirectMessage(request?.Content);
        var message = new DirectMessage(userId, friendId, content);

        _db.DirectMessages.Add(message);
        await _db.SaveChangesAsync();

        await Clients
            .Groups(UserGroup(userId), UserGroup(friendId))
            .SendAsync("DirectMessageReceived", message.ToDirectMessageResponse());
    }

    public static string UserGroup(Guid userId)
    {
        return $"user-{userId:N}";
    }

    private Guid GetUserId()
    {
        var value = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(value, out var userId))
            throw new HubException("Signed-in account identity is not available for this connection");

        return userId;
    }

    private async Task EnsureFriendship(Guid userId, Guid friendId)
    {
        if (friendId == userId)
            throw new HubException("You cannot message yourself");

        var areFriends = await FriendQueries.AreFriendsAsync(_db, userId, friendId, Context.ConnectionAborted);

        if (!areFriends)
            throw new HubException("You can message only your friends");
    }

    private async Task NotifyFriendsPresenceAsync(Guid userId, bool isOnline)
    {
        var friendIds = await _db.Friendships
            .AsNoTracking()
            .Where(friendship => friendship.Status == FriendshipStatus.Accepted
                                 && (friendship.UserLowId == userId || friendship.UserHighId == userId))
            .Select(friendship => friendship.UserLowId == userId
                ? friendship.UserHighId
                : friendship.UserLowId)
            .ToListAsync();

        if (friendIds.Count == 0)
            return;

        await Clients
            .Groups(friendIds.Select(UserGroup).ToArray())
            .SendAsync(
                "FriendPresenceChanged",
                new FriendPresenceChangedResponse(userId, isOnline));
    }

    private static string NormalizeDirectMessage(string? content)
    {
        var trimmed = content?.Trim();

        if (string.IsNullOrEmpty(trimmed))
            throw new HubException("Message cannot be empty");

        if (trimmed.Length > DirectMessage.MaxContentLength)
            throw new HubException($"Message must be {DirectMessage.MaxContentLength} characters or fewer");

        return trimmed;
    }
}
