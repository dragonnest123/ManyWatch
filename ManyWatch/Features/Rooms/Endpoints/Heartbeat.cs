using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class Heartbeat
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.GetAnonymousUserId();

        var member = await db.RoomMembers
            .FirstOrDefaultAsync(
                member => member.RoomId == id && member.UserId == userId,
                cancellationToken);
        if (member is null)
            return Results.NotFound(new { error = "User is not a member of this room" });

        member.LastSeenAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
