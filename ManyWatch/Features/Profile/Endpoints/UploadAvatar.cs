using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Profile.Endpoints;

public static class UploadAvatar
{
    public static async Task<IResult> Handle(
        UpdateAvatarRequest request,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var user = await db.Users
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

        if (user is null)
            return Results.Unauthorized();

        if (!AvatarDataUrl.TryParse(request.DataUrl, out var data, out var contentType))
            return Results.BadRequest(new { error = "Avatar must be a PNG, JPEG or WebP image up to 512 KB" });

        var updatedAt = DateTime.UtcNow;
        var avatar = await db.UserAvatars
            .FirstOrDefaultAsync(avatar => avatar.UserId == userId, cancellationToken);

        if (avatar is null)
        {
            db.UserAvatars.Add(new UserAvatar(userId, data, contentType, updatedAt));
        }
        else
        {
            avatar.Update(data, contentType, updatedAt);
        }

        user.AvatarUpdatedAt = updatedAt;

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new AvatarResponse(ProfileMapping.AvatarUrl(user)!));
    }
}
