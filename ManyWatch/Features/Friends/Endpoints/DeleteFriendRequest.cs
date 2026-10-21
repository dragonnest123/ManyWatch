using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class DeleteFriendRequest
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

        if (friendship.Status != FriendshipStatus.Pending)
            return Results.Conflict(new { error = "Friend request is no longer pending" });

        var otherUserId = friendship.OtherUserId(userId);

        db.Friendships.Remove(friendship);
        await db.SaveChangesAsync(cancellationToken);

        await FriendsRealtime.NotifyAsync(
            hub,
            otherUserId,
            "FriendRequestRemoved",
            new { requestId = friendship.Id },
            cancellationToken);

        return Results.NoContent();
    }
}
