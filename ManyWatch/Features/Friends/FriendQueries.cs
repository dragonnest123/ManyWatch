using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends;

internal static class FriendQueries
{
    public static Task<Friendship?> FindAsync(
        AppDbContext db,
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken cancellationToken)
    {
        var (lowId, highId) = Friendship.Order(firstUserId, secondUserId);

        return db.Friendships.FirstOrDefaultAsync(
            friendship => friendship.UserLowId == lowId && friendship.UserHighId == highId,
            cancellationToken);
    }

    public static async Task<bool> AreFriendsAsync(
        AppDbContext db,
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken cancellationToken)
    {
        var friendship = await FindAsync(db, firstUserId, secondUserId, cancellationToken);

        return friendship?.Status == FriendshipStatus.Accepted;
    }

    public static FriendRelationship GetRelationship(Friendship? friendship, Guid? viewerId)
    {
        if (viewerId is null || friendship is null)
            return FriendRelationship.None;

        if (friendship.Status == FriendshipStatus.Accepted)
            return FriendRelationship.Friends;

        return friendship.RequestedById == viewerId
            ? FriendRelationship.OutgoingRequest
            : FriendRelationship.IncomingRequest;
    }
}
