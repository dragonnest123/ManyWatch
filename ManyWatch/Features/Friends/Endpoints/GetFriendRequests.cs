using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class GetFriendRequests
{
    public static async Task<IResult> Handle(
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var pendingRequests = await db.Friendships
            .AsNoTracking()
            .Where(friendship => friendship.Status == FriendshipStatus.Pending
                                 && (friendship.UserLowId == userId || friendship.UserHighId == userId))
            .ToListAsync(cancellationToken);

        var otherUserIds = pendingRequests
            .Select(friendship => friendship.OtherUserId(userId))
            .ToArray();

        var users = await db.Users
            .AsNoTracking()
            .Where(user => ((IEnumerable<Guid>)otherUserIds).Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var requests = pendingRequests
            .Where(friendship => users.ContainsKey(friendship.OtherUserId(userId)))
            .Select(friendship => new
            {
                Response = friendship.ToFriendRequestResponse(users[friendship.OtherUserId(userId)]),
                IsIncoming = friendship.RequestedById != userId,
            })
            .OrderByDescending(item => item.Response.CreatedAt)
            .ToArray();

        var incoming = requests
            .Where(item => item.IsIncoming)
            .Select(item => item.Response)
            .ToArray();

        var outgoing = requests
            .Where(item => !item.IsIncoming)
            .Select(item => item.Response)
            .ToArray();

        return Results.Ok(new FriendRequestsResponse(incoming, outgoing));
    }
}
