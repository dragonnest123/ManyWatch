using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class LeaveRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .Include(room => room.Members)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        var member = room.Members.FirstOrDefault(member => member.UserId == userId);
        if (member is null)
            return Results.NotFound(new { error = "User is not a member of this room." });

        room.RemoveMember(member);
        if (room.Members.Count == 0)
            db.Rooms.Remove(room);

        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
