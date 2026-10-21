using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class RecordWatchTime
{
    public static async Task<IResult> Handle(
        RecordWatchTimeRequest request,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var user = await db.Users
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

        if (user is null)
            return Results.Unauthorized();

        user.AddWatchedSeconds(request.Seconds);

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new WatchTimeResponse(user.WatchedSeconds));
    }
}
