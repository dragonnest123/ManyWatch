using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class GetFriends
{
    public static async Task<IResult> Handle(
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var friendships = await db.Friendships
            .AsNoTracking()
            .Where(friendship => friendship.Status == FriendshipStatus.Accepted
                                 && (friendship.UserLowId == userId || friendship.UserHighId == userId))
            .ToListAsync(cancellationToken);

        var friendIds = friendships
            .Select(friendship => friendship.OtherUserId(userId))
            .ToArray();

        var users = await db.Users
            .AsNoTracking()
            .Where(user => ((IEnumerable<Guid>)friendIds).Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var friends = friendships
            .Where(friendship => users.ContainsKey(friendship.OtherUserId(userId)))
            .Select(friendship => friendship.ToFriendResponse(users[friendship.OtherUserId(userId)]))
            .OrderBy(friend => friend.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Results.Ok(friends);
    }
}
