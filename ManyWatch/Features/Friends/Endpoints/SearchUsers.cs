using ManyWatch.Domain;
using ManyWatch.Features.Profile;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class SearchUsers
{
    private const int MaxResults = 10;
    private const int MinQueryLength = 2;

    public static async Task<IResult> Handle(
        string? query,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();
        var term = query?.Trim().ToLowerInvariant();

        if (string.IsNullOrEmpty(term) || term.Length < MinQueryLength)
            return Results.Ok(Array.Empty<UserSearchResultResponse>());

        var users = await db.Users
            .AsNoTracking()
            .Where(user => user.Id != userId
                           && (user.DisplayName.ToLower().Contains(term)
                               || user.Email.ToLower().Contains(term)))
            .OrderBy(user => user.DisplayName)
            .Take(MaxResults)
            .ToListAsync(cancellationToken);

        var friendships = await db.Friendships
            .AsNoTracking()
            .Where(friendship => friendship.UserLowId == userId || friendship.UserHighId == userId)
            .ToListAsync(cancellationToken);

        var friendshipsByUserId = friendships
            .ToDictionary(friendship => friendship.OtherUserId(userId));

        var results = users
            .Select(user => new UserSearchResultResponse(
                user.Id,
                user.DisplayName,
                user.Email,
                GetRelationship(friendshipsByUserId.GetValueOrDefault(user.Id), userId),
                ProfileMapping.AvatarUrl(user)))
            .ToArray();

        return Results.Ok(results);
    }

    private static FriendRelationship GetRelationship(Friendship? friendship, Guid userId)
    {
        if (friendship is null)
            return FriendRelationship.None;

        if (friendship.Status == FriendshipStatus.Accepted)
            return FriendRelationship.Friends;

        return friendship.RequestedById == userId
            ? FriendRelationship.OutgoingRequest
            : FriendRelationship.IncomingRequest;
    }
}
