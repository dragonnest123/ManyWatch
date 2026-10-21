using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class AcceptFriendRequest
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        IHubContext<FriendsHub> hub,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var friendship = await db.Friendships
            .FirstOrDefaultAsync(friendship => friendship.Id == id, cancellationToken);
        if (friendship is null || !friendship.IsParticipant(userId))
            return Results.NotFound(new { error = "Friend request was not found" });

        if (friendship.Status == FriendshipStatus.Accepted)
            return Results.Conflict(new { error = "You are already friends" });

        if (friendship.RequestedById == userId)
            return Results.BadRequest(new { error = "You cannot accept your own friend request" });

        friendship.Accept(userId);
        await db.SaveChangesAsync(cancellationToken);

        var requesterId = friendship.OtherUserId(userId);

        var users = await db.Users
            .AsNoTracking()
            .Where(user => user.Id == requesterId || user.Id == userId)
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        if (users.TryGetValue(requesterId, out var requester) && users.TryGetValue(userId, out var currentUser))
        {
            await FriendsRealtime.NotifyAsync(
                hub,
                requester.Id,
                "FriendRequestAccepted",
                friendship.ToFriendResponse(currentUser),
                cancellationToken);
        }

        return Results.NoContent();
    }
}
