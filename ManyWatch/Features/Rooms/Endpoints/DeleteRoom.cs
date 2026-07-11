using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class DeleteRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        Guid userId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = await db.Rooms
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });
        if (room.HostId != userId)
            return Results.Forbid();

        db.Rooms.Remove(room);
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
