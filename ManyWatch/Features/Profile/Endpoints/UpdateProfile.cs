using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class UpdateProfile
{
    public static async Task<IResult> Handle(
        UpdateProfileRequest request,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var user = await db.Users
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

        if (user is null)
            return Results.Unauthorized();

        user.UpdateProfile(request.DisplayName.Trim(), request.Bio);

        await db.SaveChangesAsync(cancellationToken);

        var friendCount = await ProfileQueries.CountFriendsAsync(db, userId, cancellationToken);

        return Results.Ok(user.ToProfileResponse(friendCount));
    }
}
