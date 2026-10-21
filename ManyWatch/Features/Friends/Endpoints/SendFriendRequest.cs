using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class SendFriendRequest
{
    public static async Task<IResult> Handle(
        AddFriendRequest request,
        HttpContext context,
        AppDbContext db,
        IHubContext<FriendsHub> hub,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        if (request.UserId == userId)
            return Results.BadRequest(new { error = "You cannot add yourself as a friend" });

        var targetUser = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == request.UserId, cancellationToken);
        if (targetUser is null)
            return Results.NotFound(new { error = "User was not found" });

        var currentUser = await db.Users
            .AsNoTracking()
            .FirstAsync(user => user.Id == userId, cancellationToken);

        var existingFriendship = await FriendQueries.FindAsync(db, userId, targetUser.Id, cancellationToken);

        if (existingFriendship is not null)
        {
            if (existingFriendship.Status == FriendshipStatus.Accepted)
                return Results.Conflict(new { error = "You are already friends" });

            if (existingFriendship.RequestedById == userId)
                return Results.Conflict(new { error = "Friend request was already sent" });
            
            existingFriendship.Accept(userId);
            await db.SaveChangesAsync(cancellationToken);

            await FriendsRealtime.NotifyAsync(
                hub,
                targetUser.Id,
                "FriendRequestAccepted",
                existingFriendship.ToFriendResponse(currentUser),
                cancellationToken);

            return Results.NoContent();
        }

        var friendship = new Friendship(userId, targetUser.Id);
        db.Friendships.Add(friendship);
        await db.SaveChangesAsync(cancellationToken);

        await FriendsRealtime.NotifyAsync(
            hub,
            targetUser.Id,
            "FriendRequestReceived",
            friendship.ToFriendRequestResponse(currentUser),
            cancellationToken);

        return Results.Created(
            $"/friends/requests/{friendship.Id}",
            friendship.ToFriendRequestResponse(targetUser));
    }
}
