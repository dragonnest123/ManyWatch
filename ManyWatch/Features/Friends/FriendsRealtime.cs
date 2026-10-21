using Microsoft.AspNetCore.SignalR;

namespace ManyWatch.Features.Friends;

internal static class FriendsRealtime
{
    public static Task NotifyAsync<TPayload>(
        IHubContext<FriendsHub> hub,
        Guid userId,
        string eventName,
        TPayload payload,
        CancellationToken cancellationToken = default)
    {
        return hub.Clients
            .Group(FriendsHub.UserGroup(userId))
            .SendAsync(eventName, payload, cancellationToken);
    }
}
