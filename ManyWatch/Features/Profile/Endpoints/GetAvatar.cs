using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class GetAvatar
{
    public static async Task<IResult> Handle(
        Guid userId,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var avatar = await db.UserAvatars
            .AsNoTracking()
            .FirstOrDefaultAsync(avatar => avatar.UserId == userId, cancellationToken);

        if (avatar is null)
            return Results.NotFound();

        context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";

        return Results.File(avatar.Data, avatar.ContentType);
    }
}
