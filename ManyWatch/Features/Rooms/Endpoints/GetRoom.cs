using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class GetRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = await db.Rooms
            .AsNoTracking()
            .Include(room => room.Members)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);

        return room is null
            ? Results.NotFound(new { error = "Room was not found." })
            : Results.Ok(room.ToResponse());
    }
}