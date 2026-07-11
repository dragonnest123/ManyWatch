using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class LeaveRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        Guid userId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = await db.Rooms
            .Include(room => room.Members)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });
        
        var member = room.Members.FirstOrDefault(member => member.UserId == userId);
        if (member is null)
            return Results.NotFound(new { error = "User is not a member of this room." });

        room.Members.Remove(member);
        
        if (!member.IsHost)
        {
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(room.ToResponse());
        }

        var nextHost = room.Members.MinBy(x => x.JoinedAt);
        if (nextHost is null)
        {
            db.Rooms.Remove(room);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { message = "Host left the room. Room was deleted." });
        }
        
        nextHost.IsHost = true;
        await db.SaveChangesAsync(cancellationToken);
        
        return Results.Ok(new { message = $"Host left the room. New host has been assigned"});
    }
}
