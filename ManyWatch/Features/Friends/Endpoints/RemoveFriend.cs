using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class RemoveFriend
{
    public static async Task<IResult> Handle(
        Guid friendId,
        HttpContext context,
        AppDbContext db,
        IHubContext<FriendsHub> hub,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var friendship = await FriendQueries.FindAsync(db, userId, friendId, cancellationToken);
        if (friendship is null || friendship.Status != FriendshipStatus.Accepted)
            return Results.NotFound(new { error = "Friendship was not found" });

        var invitations = await db.RoomInvitations
            .Where(invitation =>
                (invitation.SenderId == userId && invitation.RecipientId == friendId)
                || (invitation.SenderId == friendId && invitation.RecipientId == userId))
            .ToListAsync(cancellationToken);

        db.Friendships.Remove(friendship);
        db.RoomInvitations.RemoveRange(invitations);
        await db.SaveChangesAsync(cancellationToken);

        await FriendsRealtime.NotifyAsync(
            hub,
            friendId,
            "FriendRemoved",
            new { userId },
            cancellationToken);

        return Results.NoContent();
    }
}
