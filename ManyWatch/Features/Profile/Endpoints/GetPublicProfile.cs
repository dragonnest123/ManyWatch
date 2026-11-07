using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ManyWatch.Domain;
using ManyWatch.Features.Friends;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class GetPublicProfile
{
    public static async Task<IResult> Handle(
        string username,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var normalizedUsername = UsernameRules.Normalize(username);

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Username == normalizedUsername, cancellationToken);
        if (user is null)
            return Results.NotFound(new { error = "User was not found" });

        var viewerId = TryGetAccountUserId(context);
        var isSelf = viewerId == user.Id;

        Friendship? friendship = null;
        if (viewerId is not null && !isSelf)
        {
            friendship = await FriendQueries.FindAsync(db, viewerId.Value, user.Id, cancellationToken);
        }

        var friendCount = await ProfileQueries.CountFriendsAsync(db, user.Id, cancellationToken);
        var relationship = isSelf
            ? FriendRelationship.None
            : FriendQueries.GetRelationship(friendship, viewerId);

        return Results.Ok(new PublicProfileResponse(
            user.Id,
            user.Username,
            user.DisplayName,
            user.Bio,
            ProfileMapping.AvatarUrl(user),
            user.CreatedAt,
            friendCount,
            relationship,
            isSelf));
    }

    private static Guid? TryGetAccountUserId(HttpContext context)
    {
        var value = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(value, out var userId) ? userId : null;
    }
}
