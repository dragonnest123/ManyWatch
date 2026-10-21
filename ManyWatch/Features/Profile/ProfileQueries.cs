using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile;

internal static class ProfileQueries
{
    public static Task<int> CountFriendsAsync(
        AppDbContext db,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return db.Friendships.CountAsync(
            friendship => friendship.Status == FriendshipStatus.Accepted
                          && (friendship.UserLowId == userId || friendship.UserHighId == userId),
            cancellationToken);
    }
}
