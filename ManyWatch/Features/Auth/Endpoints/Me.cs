using ManyWatch.Features.Profile;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Auth.Endpoints;

public static class Me
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

        return Results.Ok(new MeResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.CreatedAt,
            ProfileMapping.AvatarUrl(user)));
    }
}
