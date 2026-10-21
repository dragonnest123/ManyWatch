using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class DeleteAvatar
{
    public static async Task<IResult> Handle(
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var user = await db.Users
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

        if (user is null)
            return Results.Unauthorized();

        var avatar = await db.UserAvatars
            .FirstOrDefaultAsync(avatar => avatar.UserId == userId, cancellationToken);

        if (avatar is not null)
            db.UserAvatars.Remove(avatar);

        user.AvatarUpdatedAt = null;

        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
