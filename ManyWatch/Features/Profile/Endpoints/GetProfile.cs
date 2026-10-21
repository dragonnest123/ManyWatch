using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class GetProfile
{
    public static async Task<IResult> Handle(
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

        if (user is null)
            return Results.Unauthorized();

        var friendCount = await ProfileQueries.CountFriendsAsync(db, userId, cancellationToken);

        return Results.Ok(user.ToProfileResponse(friendCount));
    }
}
