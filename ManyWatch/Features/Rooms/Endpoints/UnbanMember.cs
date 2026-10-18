using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class UnbanMember
{
    public static async Task<IResult> Handle(
        Guid id,
        Guid userId,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var callerId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        if (room.HostId != callerId)
            return Results.Json(new { error = "Only the host can unban members." }, statusCode: StatusCodes.Status403Forbidden);

        var ban = await db.RoomBans
            .FirstOrDefaultAsync(ban => ban.RoomId == id && ban.UserId == userId, cancellationToken);

        if (ban is not null)
        {
            db.RoomBans.Remove(ban);
            await db.SaveChangesAsync(cancellationToken);
        }

        return Results.NoContent();
    }
}
